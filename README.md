# HQLint - HQL Language Server & VS Code Extension

HQLint is a high-performance Language Server for Hive Query Language (HQL), written in Rust. It provides real-time linting, formatting, and autocompletion for HQL scripts.

This repository contains:
- **`crates/hql-ls`**: The core HQL Language Server (LSP) implementation in Rust.
- **`editors/code`**: The Visual Studio Code extension client.
- **`notepad++`**: Syntax highlighting support for Notepad++.

## Features

- **🚀 Fast**: Powered by a Rust-based Language Server (`sqlparser-rs`).
- **🔍 Linting**:
  - Syntax validation.
  - Keyword casing (e.g., `SELECT` vs `select`).
  - Missing semicolons (statement termination).
  - Unbalanced parentheses.
  - Hive variable syntax (`${hiveconf:var}`).
  - Missing commas in SELECT lists (heuristic).
- **✨ Formatting**: Automatic code formatting using `sqlformat`.
- **💡 Autocomplete**: Context-aware completion for keywords and snippets.
- **📝 Editor Support**:
  - **VS Code**: Full feature set.
  - **Notepad++**: Syntax highlighting (via UDL) + Linting (via LSP plugin).
  - **Other Editors**: Any LSP-compliant editor (Neovim, Emacs, Helix) can use the `hql-ls` binary.

## Building from Source

### Prerequisites
- **Rust** (latest stable)
- **Node.js** & **npm**

### Build Steps

1.  **Build the Language Server:**
    ```bash
    cargo build --release
    ```
    The binary will be at `target/release/hql-ls`.

2.  **Build the VS Code Extension:**
    ```bash
    cd editors/code
    npm install
    
    # Copy the binary to the extension folder (required for bundling)
    mkdir -p server
    cp ../../target/release/hql-ls server/
    
    # Package into VSIX
    npx @vscode/vsce package
    ```

## Notepad++ Support

1.  Import `notepad++/HQL_UDL.xml` via **Language > User Defined Language > Define your language... > Import**.
2.  For linting support, configure the **NppLSP** plugin to use the built `hql-ls` binary.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
