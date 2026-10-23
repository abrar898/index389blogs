import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

export interface DocxExportInput {
  title: string;
  subtitle?: string | null;
  authorName: string;
  publishedAt?: Date | null;
  content: string; // Markdown content
}

export async function generateArticleDocx(data: DocxExportInput): Promise<Buffer> {
  const lines = data.content.split("\n");
  const paragraphs: (Paragraph | Table)[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  // Subtitle
  if (data.subtitle) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.subtitle,
            italics: true,
            color: "555555",
            size: 24, // 12pt
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // Metadata Bar
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Author: ${data.authorName} | Published: ${
            data.publishedAt ? new Date(data.publishedAt).toLocaleDateString() : "Draft"
          } | Platform: CyberVault Technical Research`,
          italics: true,
          color: "666666",
          size: 20, // 10pt
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Parse lines into Word elements
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        // Output code table
        paragraphs.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: codeBuffer.map(
                      (cLine) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cLine || " ",
                              font: "Consolas",
                              size: 19,
                              color: "111827",
                            }),
                          ],
                          spacing: { line: 240 },
                        })
                    ),
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      left: { style: BorderStyle.SINGLE, size: 6, color: "06B6D4" }, // Cyan accent left border
                      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    },
                  }),
                ],
              }),
            ],
          })
        );
        paragraphs.push(new Paragraph({ spacing: { after: 150 } }));
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace("# ", "").trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace("## ", "").trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 250, after: 120 },
        })
      );
    } else if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace("### ", "").trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith("> ")) {
      // Callout or quote
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^>\s*/, ""),
              italics: true,
              color: "0F766E", // Muted Teal
            }),
          ],
          indent: { left: 720 },
          spacing: { before: 150, after: 150 },
        })
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // Bullet list
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^[-*]\s*/, ""),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else if (line.trim().length > 0) {
      // Normal paragraph
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 150, line: 280 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
