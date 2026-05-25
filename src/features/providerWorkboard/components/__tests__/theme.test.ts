// Cover the central theme tone helpers used by Badge/SiteRow/sheets.

import {
  toneForPriority,
  toneForVisitStatus,
  toneForWorkStatus,
} from "../ui/theme";

describe("toneForWorkStatus", () => {
  it("blocked → danger", () => expect(toneForWorkStatus("blocked")).toBe("danger"));
  it("needs_attention → warn", () => expect(toneForWorkStatus("needs_attention")).toBe("warn"));
  it("in_progress → info", () => expect(toneForWorkStatus("in_progress")).toBe("info"));
  it("completed → success", () => expect(toneForWorkStatus("completed")).toBe("success"));
  it("scheduled → neutral", () => expect(toneForWorkStatus("scheduled")).toBe("neutral"));
});

describe("toneForVisitStatus", () => {
  it("blocked → danger", () => expect(toneForVisitStatus("blocked")).toBe("danger"));
  it("completed → success", () => expect(toneForVisitStatus("completed")).toBe("success"));
  it("cancelled → neutral", () => expect(toneForVisitStatus("cancelled")).toBe("neutral"));
  it("en_route → info", () => expect(toneForVisitStatus("en_route")).toBe("info"));
  it("on_site → info", () => expect(toneForVisitStatus("on_site")).toBe("info"));
  it("scheduled → neutral (default)", () =>
    expect(toneForVisitStatus("scheduled")).toBe("neutral"));
  it("confirmed → neutral (default)", () =>
    expect(toneForVisitStatus("confirmed")).toBe("neutral"));
});

describe("toneForPriority", () => {
  it("urgent → danger", () => expect(toneForPriority("urgent")).toBe("danger"));
  it("high → warn", () => expect(toneForPriority("high")).toBe("warn"));
  it("normal → neutral", () => expect(toneForPriority("normal")).toBe("neutral"));
});
