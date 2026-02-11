use std::{borrow::Cow, path::Path};

use regex::Regex;
use serde_json;
use wasm_bindgen::prelude::*;

// a definitely invalid filename in real filesystem
const RUNTIME_API_MODULE: &str = "\0<MPFLOW_WXML_LOADER_RUNTIME_API_MODULE>\0";

#[inline(always)]
pub(crate) fn escape_string(code: &str) -> String {
    serde_json::to_string(code).unwrap()
}

pub(crate) struct ImportMessage {
    pub(crate) import_name: String,
    pub(crate) url: String,
}
pub(crate) struct ChildImportMessage {
    pub(crate) import_name: String,
}
pub(crate) struct ReplaceMessage {
    pub(crate) re_pattern: Regex,
    pub(crate) target: String,
    pub(crate) replacement_name: String,
}

pub(crate) fn get_import_code(
    stringify_request: &js_sys::Function,
    imports: &[ImportMessage],
    es_module: bool,
) -> String {
    let this = JsValue::null();
    let get_stringify_request = |url: &str| {
        stringify_request
            .call1(&this, &JsValue::from_str(url))
            .unwrap()
            .as_string()
            .unwrap()
    };
    let runtime_api_url = get_stringify_request(RUNTIME_API_MODULE);
    let mut code = if es_module {
        format!(
            "import ___WXML_LOADER_API_IMPORT___ from {}\n",
            runtime_api_url
        )
    } else {
        format!(
            "var ___WXML_LOADER_API_IMPORT___ = require({})\n",
            runtime_api_url
        )
    };
    for item in imports {
        let request = if Path::new(&item.url).is_absolute() {
            escape_string(&item.url)
        } else {
            get_stringify_request(&item.url)
        };
        let import_code = if es_module {
            format!("import {} from {};\n", item.import_name, request)
        } else {
            format!("var {} = require({});\n", item.import_name, request)
        };
        code.push_str(&import_code);
    }
    code
}

pub(crate) fn get_module_code(
    tmpl: &str,
    child_imports: &[ChildImportMessage],
    replacers: &[ReplaceMessage],
    url: String,
    es_module: bool,
) -> String {
    let mut content = escape_string(tmpl);
    let mut header = String::from(if es_module {
        "var exports = ___WXML_LOADER_API_IMPORT___();\n"
    } else {
        "exports = ___WXML_LOADER_API_IMPORT___();\n"
    });
    for item in child_imports {
        header.push_str(&format!("exports.i({});\n", item.import_name));
    }
    for item in replacers {
        header.push_str(&format!(
            "var {} = {};\n",
            item.replacement_name, item.target
        ));
        // Replace the placeholder string in tmpl with JS string concatenation
        // e.g. "...___WXML_LOADER_PLACEHOLDER_0___..." -> "..." + ___WXML_LOADER_PLACEHOLDER_0___ + "..."
        let replacement = format!("\" + {} + \"", item.replacement_name);
        let res = item
            .re_pattern
            .replace_all(&content, replacement.as_str());
        match res {
            Cow::Borrowed(_) => {}
            Cow::Owned(res) => {
                content = res;
            }
        }
    }
    header.push_str(&format!("exports.url = {};\n", url));
    format!(
        "{header}\nexports.e(module.id, {}, {}, undefined);\n",
        content, url
    )
}

pub(crate) fn get_export_code(es_module: bool) -> &'static str {
    if es_module {
        "export default exports\n"
    } else {
        "module.exports = exports\n"
    }
}
