import { visit } from "unist-util-visit";

// The layout owns the article title; keep the author's Markdown H1 in the source.
export function essayHeadings() {
  return (tree) => {
    if (tree.children[0]?.type === "heading" && tree.children[0].depth === 1) {
      tree.children.shift();
    }
  };
}

export function accessibleTables() {
  return (tree) => {
    let tableNumber = 0;
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "table" || !parent || typeof index !== "number") return;
      tableNumber += 1;
      visit(node, "element", (cell) => {
        if (cell.tagName === "th") cell.properties.scope = "col";
      });
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["table-scroll"],
          tabIndex: 0,
          role: "region",
          ariaLabel: `Table ${tableNumber} (scroll horizontally if needed)`,
        },
        children: [node],
      };
      return index + 1;
    });
  };
}
