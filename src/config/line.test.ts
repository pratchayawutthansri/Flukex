import { describe, expect, it } from "vitest";
import { getSafeLineAddFriendUrl } from "./line";

describe("LINE Add Friend URL validation", () => {
  it("accepts official LINE hosts over HTTPS", () => {
    expect(getSafeLineAddFriendUrl("https://line.me/R/ti/p/@flukex")).toBe("https://line.me/R/ti/p/@flukex");
    expect(getSafeLineAddFriendUrl("https://lin.ee/example")).toBe("https://lin.ee/example");
  });

  it("rejects non-LINE, insecure, and invalid URLs", () => {
    expect(getSafeLineAddFriendUrl("https://example.com/line")).toBe("");
    expect(getSafeLineAddFriendUrl("http://line.me/R/ti/p/@flukex")).toBe("");
    expect(getSafeLineAddFriendUrl("javascript:alert(1)")).toBe("");
  });
});
