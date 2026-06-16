import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Crown, Inbox } from "lucide-react";
import { BookingStatusBadge } from "./StatusBadge";
import { VerifiedBadge, PremiumBadge, BasicBadge } from "./Badges";
import { PaymentBadge } from "./PaymentBadge";
import { Stepper } from "./Stepper";
import { EmptyState } from "./EmptyState";
import { GuidedHeader } from "./GuidedHeader";

describe("BookingStatusBadge", () => {
  it("renders the German label for a known status", () => {
    render(<BookingStatusBadge status="confirmed" />);
    expect(screen.getByText("Bestätigt")).toBeInTheDocument();
  });

  it("renders the raw status for an unknown value", () => {
    render(<BookingStatusBadge status="mystery" />);
    expect(screen.getByText("mystery")).toBeInTheDocument();
  });
});

describe("tier badges", () => {
  it("renders verified, premium, and basic badges with stable testids", () => {
    render(
      <>
        <VerifiedBadge />
        <PremiumBadge />
        <BasicBadge />
      </>,
    );
    expect(screen.getByTestId("badge-verified")).toHaveTextContent("Verifiziert");
    expect(screen.getByTestId("badge-premium")).toHaveTextContent("Premium");
    expect(screen.getByTestId("badge-basic")).toHaveTextContent("Basic");
  });

  it("never labels the premium tier as 'Top'", () => {
    render(<PremiumBadge size="md" />);
    expect(screen.getByTestId("badge-premium")).not.toHaveTextContent("Top");
  });
});

describe("PaymentBadge", () => {
  it.each([
    ["offen", "Zahlung offen"],
    ["bezahlt", "Bezahlt"],
    ["direkt", "Direkt mit Berater"],
  ] as const)("renders the %s variant label", (variant, label) => {
    render(<PaymentBadge variant={variant} />);
    expect(screen.getByTestId(`badge-payment-${variant}`)).toHaveTextContent(label);
  });
});

describe("Stepper", () => {
  it("marks completed, active, and upcoming steps", () => {
    render(<Stepper steps={["Leistung", "Termin", "Bestätigung"]} current={1} />);
    expect(screen.getByTestId("step-0")).toHaveAttribute("data-state", "done");
    expect(screen.getByTestId("step-1")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("step-2")).toHaveAttribute("data-state", "upcoming");
  });

  it("shows a number for not-yet-done steps and renders every label", () => {
    render(<Stepper steps={["Profil", "Leistungen", "Verfügbarkeit"]} current={0} />);
    expect(screen.getByTestId("step-0")).toHaveTextContent("1");
    expect(screen.getByText("Profil")).toBeInTheDocument();
    expect(screen.getByText("Leistungen")).toBeInTheDocument();
    expect(screen.getByText("Verfügbarkeit")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders the title, description, icon, and action content", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Keine Buchungen"
        description="Sie haben noch keine Termine."
      >
        <button>Jetzt buchen</button>
      </EmptyState>,
    );
    expect(screen.getByText("Keine Buchungen")).toBeInTheDocument();
    expect(screen.getByText("Sie haben noch keine Termine.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jetzt buchen" })).toBeInTheDocument();
  });
});

describe("GuidedHeader", () => {
  it("renders title, subtitle, and an embedded stepper when steps are given", () => {
    render(
      <GuidedHeader
        icon={Crown}
        title="Profil einrichten"
        subtitle="Schritt für Schritt"
        steps={["Profil", "Leistungen", "Verfügbarkeit"]}
        current={0}
      />,
    );
    expect(screen.getByRole("heading", { name: "Profil einrichten" })).toBeInTheDocument();
    expect(screen.getByText("Schritt für Schritt")).toBeInTheDocument();
    expect(screen.getByTestId("stepper")).toBeInTheDocument();
  });

  it("omits the stepper when no steps are provided", () => {
    render(<GuidedHeader icon={Crown} title="Nur Titel" />);
    expect(screen.queryByTestId("stepper")).not.toBeInTheDocument();
  });
});
