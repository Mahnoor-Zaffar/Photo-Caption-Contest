import { sanitizeCaptionText } from "../src/utils/sanitize.js";

describe("sanitizeCaptionText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeCaptionText("<script>alert(1)</script>Hello")).toBe("Hello");
    expect(sanitizeCaptionText("<b>Bold</b> caption")).toBe("Bold caption");
  });

  it("normalizes whitespace", () => {
    expect(sanitizeCaptionText("  hello   world  ")).toBe("hello world");
  });
});
