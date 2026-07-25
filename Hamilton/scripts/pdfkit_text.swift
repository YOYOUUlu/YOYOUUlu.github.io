import Foundation
import PDFKit

struct PageText: Codable {
    let page: Int
    let text: String
}

if CommandLine.arguments.count < 2 {
    fputs("usage: pdfkit_text.swift PDF_PATH\n", stderr)
    exit(2)
}

let pdfURL = URL(fileURLWithPath: CommandLine.arguments[1])
guard let document = PDFDocument(url: pdfURL) else {
    fputs("cannot open PDF: \(CommandLine.arguments[1])\n", stderr)
    exit(1)
}

let pages: [PageText] = (0..<document.pageCount).map { index in
    let text = document.page(at: index)?.string ?? ""
    return PageText(page: index + 1, text: text)
}

do {
    let data = try JSONEncoder().encode(pages)
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write("\n".data(using: .utf8)!)
} catch {
    fputs("failed to encode PDF text: \(error)\n", stderr)
    exit(1)
}
