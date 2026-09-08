import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders meaningful server-first content", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: /나의 선택이 모두의 랭킹.*됩니다/ })).toBeInTheDocument();
    expect(screen.getByText(/첫 공개 콘텐츠를 준비하고 있습니다/)).toBeInTheDocument();
  });

  it("uses a single main landmark and ordered quality principles", () => {
    render(<Home />);

    expect(screen.getAllByRole("main")).toHaveLength(1);
    const principles = screen.getByRole("list");
    expect(within(principles).getAllByRole("listitem")).toHaveLength(3);
  });
});
