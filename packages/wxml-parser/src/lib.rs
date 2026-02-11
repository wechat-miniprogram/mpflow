use std::collections::HashMap;

use glass_easel_template_compiler::{
    parse::{
        tag::{ElementKind, Node, Script, Value},
        ParseErrorLevel, Position,
    },
    stringify::{Stringifier, Stringify, StringifyOptions},
    TmplGroup,
};
use regex::Regex;
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::prelude::*;
use web_sys::console;

use crate::code_stringify::{
    get_export_code, get_import_code, get_module_code, ChildImportMessage, ImportMessage,
    ReplaceMessage,
};

mod code_stringify;

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
#[allow(non_camel_case_types)]
#[serde(rename_all = "camelCase")]
pub enum ImportTypeEnum {
    child,
    inline,
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct ImportAttribute {
    tag: String,
    attribute: String,
    #[tsify(optional)]
    import_type: Option<ImportTypeEnum>,
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct WxmlParserOptions {
    public_path: String,
    es_module: bool,
    minimize: bool,
    resolve_mustache: bool,
    attributes: Vec<ImportAttribute>,
}

#[wasm_bindgen]
pub fn get_code(
    wxml_path: String,
    wxml_content: String,
    option: WxmlParserOptions,
    stringify_request: &js_sys::Function,
    url_to_request: &js_sys::Function,
) -> String {
    console_error_panic_hook::set_once();
    let mut tg = TmplGroup::new();
    let errors = tg.add_tmpl(&wxml_path, &wxml_content);
    let mut is_success = true;
    for err in errors {
        console::error_1(
            &format!(
                "[{}] {}",
                match err.level() {
                    ParseErrorLevel::Note => "NOTE",
                    ParseErrorLevel::Warn => "WARN",
                    ParseErrorLevel::Error => "ERROR",
                    ParseErrorLevel::Fatal => "FATAL",
                },
                err
            )
            .into(),
        );
        if err.prevent_success() {
            is_success = false;
        }
    }
    if !is_success {
        panic!("Cannot compile wxml due to errors above");
    }
    let mut tag_attr_map: HashMap<&str, HashMap<&str, _>> = HashMap::new();
    for attr in &option.attributes {
        if tag_attr_map.contains_key(attr.tag.as_str()) {
            tag_attr_map
                .get_mut(attr.tag.as_str())
                .unwrap()
                .insert(&attr.attribute, attr);
        } else {
            let mut attr_map = HashMap::new();
            attr_map.insert(attr.attribute.as_str(), attr);
            tag_attr_map.insert(attr.tag.as_str(), attr_map);
        }
    }

    let find_attr = |tag_name: &str, attrs: &[(&str, Option<&mut Value>)]| {
        if let Some(target_attr) = tag_attr_map.get(tag_name) {
            for (i, attr) in attrs.iter().enumerate() {
                if let Some(tag_attr) = target_attr.get(attr.0) {
                    return Some((i, *tag_attr));
                }
            }
        }
        None
    };

    let tmpl_tree = tg.get_tree_mut(&wxml_path).unwrap();
    let mut import_map: HashMap<String, String> = HashMap::new();
    let mut placeholder_map: HashMap<String, String> = HashMap::new();
    let mut imports = vec![];
    let mut child_imports = vec![];
    let mut replacers = vec![];

    let mut get_import_name = |url: String, is_wxs: bool| -> String {
        let url = if is_wxs && !url.ends_with(".wxs") {
            url + ".wxs"
        } else {
            url
        };
        if let Some(import_name) = import_map.get(&url) {
            import_name.to_string()
        } else {
            let import_name = format!("___WXML_LOADER_IMPORT_{}___", import_map.len());
            import_map.insert(url.clone(), import_name.clone());
            imports.push(ImportMessage {
                import_name: import_name.clone(),
                url: url.clone(),
            });
            import_name
        }
    };

    let mut get_placeholder_name = |target: String| -> String {
        if let Some(replacement_key) = placeholder_map.get(&target) {
            replacement_key.to_string()
        } else {
            let placeholder_name =
                format!("___WXML_LOADER_PLACEHOLDER_{}___", placeholder_map.len());
            placeholder_map.insert(target.clone(), placeholder_name.clone());
            replacers.push(ReplaceMessage {
                re_pattern: Regex::new(&placeholder_name).expect("invalid regex"),
                target: target,
                replacement_name: placeholder_name.clone(),
            });
            placeholder_name
        }
    };

    let mut process_node = |tag_name: &str, attrs: &mut [(&str, Option<&mut Value>)]| {
        if let Some((index, import_attr)) = find_attr(tag_name, attrs) {
            // TODO: resolve dynamic
            let (_, attr_val) = &mut attrs[index];
            match *attr_val {
                Some(Value::Static {
                    value: attr_val, ..
                }) => {
                    let import_key = url_to_request
                        .call1(&JsValue::null(), &JsValue::from_str(attr_val.as_str()))
                        .unwrap()
                        .as_string()
                        .unwrap();
                    let import_name = get_import_name(import_key, tag_name == "wxs");
                    match import_attr.import_type {
                        Some(ImportTypeEnum::child) => {
                            child_imports.push(ChildImportMessage {
                                import_name: import_name.clone(),
                            });
                            // Use placeholder so that the url will be replaced with webpack processed path at runtime
                            let placeholder =
                                get_placeholder_name(format!("exports.u({}, false)", import_name));
                            attr_val.clear();
                            attr_val.push_str(&placeholder);
                        }
                        Some(ImportTypeEnum::inline) => {
                            panic!("inline currently not supported");
                        }
                        None => {
                            // Use placeholder so that the url will be replaced with webpack processed path at runtime
                            let placeholder =
                                get_placeholder_name(format!("exports.u({}, false)", import_name));
                            attr_val.clear();
                            attr_val.push_str(&placeholder);
                        }
                    }
                }
                Some(Value::Dynamic { .. }) => {
                    if option.resolve_mustache {
                        panic!("resolve_mustache currently not supported");
                    }
                }
                _ => {}
            }
        }
    };

    fn walk_node(
        root: &mut Node,
        processor: &mut impl FnMut(&str, &mut [(&str, Option<&mut Value>)]),
    ) {
        match root {
            Node::Element(e) => match &mut e.kind {
                ElementKind::Normal {
                    children,
                    tag_name,
                    attributes,
                    ..
                } => {
                    let mut attrs: Vec<_> = attributes
                        .iter_mut()
                        .map(|x| (x.name.name.as_str(), x.value.as_mut()))
                        .collect();
                    processor(tag_name.name.as_str(), &mut attrs);
                    for child in children {
                        walk_node(child, processor);
                    }
                }
                ElementKind::Pure { children, .. } | ElementKind::For { children, .. } => {
                    for child in children {
                        walk_node(child, processor);
                    }
                }
                ElementKind::If { branches, else_branch, .. } => {
                    for branch in branches {
                        for child in &mut branch.2 {
                            walk_node(child, processor);
                        }
                    }
                    match else_branch {
                        Some(branch) => {
                            for child in &mut branch.1 {
                                walk_node(child, processor);
                            }
                        }
                        None => {}
                    }
                }
                _ => {}
            },
            _ => {}
        }
    }

    fn new_value_with(content: &str) -> Value {
        let mut val = Value::new_empty(Position {
            line: 0,
            utf16_col: 0,
        });
        match val {
            Value::Static { ref mut value, .. } => {
                value.push_str(content);
            }
            _ => unreachable!(),
        }
        val
    }

    for import_elem in &mut tmpl_tree.globals.imports {
        let mut val = new_value_with(import_elem.src.name.as_str());
        process_node("import", &mut [("src", Some(&mut val))]);
        if let Value::Static { value, .. } = val {
            import_elem.src.name = value;
        }
    }
    for include_elem in &mut tmpl_tree.globals.includes {
        let mut val = new_value_with(include_elem.src.name.as_str());
        process_node("include", &mut [("src", Some(&mut val))]);
        if let Value::Static { value, .. } = val {
            include_elem.src.name = value;
        }
    }
    for script_elem in &mut tmpl_tree.globals.scripts {
        if let Script::GlobalRef { src, .. } = script_elem {
            let mut val = new_value_with(src.name.as_str());
            process_node("wxs", &mut [("src", Some(&mut val))]);
            if let Value::Static { value, .. } = val {
                src.name = value;
            }
        }
    }

    for node in &mut tmpl_tree.content {
        walk_node(node, &mut process_node);
    }

    let options = StringifyOptions {
        expression_string_single_quote: true,
        ..Default::default()
    };
    let mut stringifier = Stringifier::new(String::new(), &wxml_path, None, options);
    tmpl_tree.stringify_write(&mut stringifier).unwrap();
    let updated_tmpl = stringifier.finish().0;

    format!(
        "{}{}{}",
        get_import_code(stringify_request, &imports, option.es_module),
        get_module_code(
            &updated_tmpl,
            &child_imports,
            &replacers,
            option.public_path,
            option.es_module,
        ),
        get_export_code(option.es_module)
    )
}
