import WebKit
import UniformTypeIdentifiers

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "app"
    static let start = URL(string: "\(scheme)://app/index.html")!

    private let root = Bundle.main.resourceURL!.appendingPathComponent("Web").standardizedFileURL

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        let path = url.path.isEmpty || url.path == "/" ? "index.html" : String(url.path.dropFirst())
        let file = root.appendingPathComponent(path).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"), let data = try? Data(contentsOf: file) else {
            task.didReceive(HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!)
            task.didFinish()
            return
        }
        let headers = [
            "Content-Type": Self.mime(for: file.pathExtension),
            "Content-Length": String(data.count),
            "Cache-Control": "no-cache",
        ]
        task.didReceive(HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    static func mime(for ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "wasm": return "application/wasm"
        case "glb": return "model/gltf-binary"
        case "glsl", "frag", "vert", "txt": return "text/plain; charset=utf-8"
        default: return UTType(filenameExtension: ext)?.preferredMIMEType ?? "application/octet-stream"
        }
    }
}

// Usage in a UIViewRepresentable:
//   let config = WKWebViewConfiguration()
//   config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: BundleSchemeHandler.scheme)
//   config.allowsInlineMediaPlayback = true
//   config.mediaTypesRequiringUserActionForPlayback = []
//   let web = WKWebView(frame: .zero, configuration: config)
//   web.load(URLRequest(url: BundleSchemeHandler.start))
