use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::*;
use tower_lsp::{Client, LanguageServer, LspService, Server};
use dashmap::DashMap;

mod linter;

#[derive(Debug)]
struct Backend {
    client: Client,
    document_map: DashMap<String, ropey::Rope>,
}

#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                text_document_sync: Some(TextDocumentSyncCapability::Kind(
                    TextDocumentSyncKind::FULL,
                )),
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

    async fn completion(&self, _: CompletionParams) -> Result<Option<CompletionResponse>> {
        Ok(Some(CompletionResponse::Array(vec![
            CompletionItem {
                label: "SELECT".to_string(),
                kind: Some(CompletionItemKind::KEYWORD),
                detail: Some("HQL Keyword".to_string()),
                ..Default::default()
            },
            CompletionItem {
                label: "FROM".to_string(),
                kind: Some(CompletionItemKind::KEYWORD),
                detail: Some("HQL Keyword".to_string()),
                ..Default::default()
            },
        ])))
    }
}

impl Backend {
    async fn on_change(&self, params: TextDocumentItem) {
        let rope = ropey::Rope::from_str(&params.text);
        self.document_map.insert(params.uri.to_string(), rope.clone());
        
        let diagnostics = linter::lint(&params.text);
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
    });
    Server::new(stdin, stdout, socket).serve(service).await;
}
