use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::*;
use tower_lsp::{Client, LanguageServer, LspService, Server};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

mod linter;
mod formatter;
mod config;
mod completion;

use config::HqlConfig;

#[derive(Debug)]
struct Backend {
    client: Client,
    document_map: DashMap<String, ropey::Rope>,
    config: Arc<RwLock<HqlConfig>>,
}

#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                text_document_sync: Some(TextDocumentSyncCapability::Kind(
                    TextDocumentSyncKind::FULL,
                )),
                document_formatting_provider: Some(OneOf::Left(true)),
                completion_provider: Some(CompletionOptions {
                    resolve_provider: Some(false),
                    trigger_characters: Some(vec![".".to_string()]),
                    work_done_progress_options: Default::default(),
                    all_commit_characters: None,
                    ..Default::default()
                }),
                ..ServerCapabilities::default()
            },
            ..Default::default()
        })
    }

    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "HQL Language Server initialized!")
            .await;
            
        // Fetch initial configuration
        // We rely on client pushing didChangeConfiguration shortly after init, 
        // but we can also log that we are ready.
    }

    async fn did_change_configuration(&self, params: DidChangeConfigurationParams) {
        self.client
            .log_message(MessageType::INFO, "Configuration changed")
            .await;
            
        // Parse settings from the generic serde_json::Value
        // The client sends { "settings": { "hql": { ... } } } usually
        let settings = params.settings;
        
        // Extract "hql" section if possible, or try to parse root
        // VS Code sends the whole settings object usually.
        let hql_settings = settings.get("hql").cloned().unwrap_or(settings);
        
        match serde_json::from_value::<HqlConfig>(hql_settings) {
            Ok(new_config) => {
                let mut write_lock = self.config.write().await;
                *write_lock = new_config;
                self.client.log_message(MessageType::INFO, "HQL configuration updated").await;
            },
            Err(e) => {
                self.client.log_message(MessageType::ERROR, format!("Failed to parse configuration: {}", e)).await;
            }
        }
        
        // Re-lint all open documents with new settings
        // Iterate over document_map keys... iterating dashmap async is tricky.
        // For now, next edit will trigger re-lint.
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }

    async fn did_open(&self, params: DidOpenTextDocumentParams) {
        self.client
            .log_message(MessageType::INFO, format!("Opened: {}", params.text_document.uri))
            .await;
        self.on_change(TextDocumentItem {
            uri: params.text_document.uri,
            text: params.text_document.text,
            version: params.text_document.version,
            language_id: "hql".to_string(),
        })
        .await;
    }

    async fn did_change(&self, params: DidChangeTextDocumentParams) {
        self.client
            .log_message(MessageType::INFO, format!("Changed: {}", params.text_document.uri))
            .await;
        // For Full sync, content_changes has one element with the full text
        if let Some(change) = params.content_changes.first() {
             self.on_change(TextDocumentItem {
                uri: params.text_document.uri,
                text: change.text.clone(),
                version: params.text_document.version,
                language_id: "hql".to_string(),
            })
            .await;
        }
    }

    async fn formatting(&self, params: DocumentFormattingParams) -> Result<Option<Vec<TextEdit>>> {
        let uri = params.text_document.uri;
        if let Some(rope) = self.document_map.get(uri.as_str()) {
            let text = rope.to_string();
            
            let config = self.config.read().await;
            if !config.formatting.enabled {
                return Ok(None);
            }
            
            let edits = formatter::format_text(&text, params.options, &config.formatting);
            
            // Adjust the range to cover the actual document
            let full_range = Range {
                start: Position { line: 0, character: 0 },
                end: Position { 
                    line: (rope.len_lines() - 1) as u32, 
                    character: rope.line(rope.len_lines() - 1).len_chars() as u32 
                },
            };
            
            let mut final_edits = edits;
            if let Some(edit) = final_edits.first_mut() {
                edit.range = full_range;
            }
            
            return Ok(Some(final_edits));
        }
        Ok(None)
    }

    async fn completion(&self, _: CompletionParams) -> Result<Option<CompletionResponse>> {
        Ok(Some(completion::get_completions()))
    }
}

impl Backend {
    async fn on_change(&self, params: TextDocumentItem) {
        let rope = ropey::Rope::from_str(&params.text);
        self.document_map.insert(params.uri.to_string(), rope.clone());
        
        let config = self.config.read().await;
        let diagnostics = linter::lint(&params.text, &config.linting);
        self.client.publish_diagnostics(params.uri, diagnostics, Some(params.version)).await;
    }
}

#[tokio::main]
async fn main() {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    let (service, socket) = LspService::new(|client| Backend {
        client,
        document_map: DashMap::new(),
        config: Arc::new(RwLock::new(HqlConfig::default())),
    });
    Server::new(stdin, stdout, socket).serve(service).await;
}
