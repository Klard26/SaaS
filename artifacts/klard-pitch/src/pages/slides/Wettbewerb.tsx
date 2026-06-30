import { SlideFrame } from "@/components/SlideFrame";

function Check() {
  return <span className="text-[2.6vw] font-bold text-green">✓</span>;
}

function Dash() {
  return <span className="text-[2.6vw] text-muted/60">–</span>;
}

function HeadCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-[0.6vw] py-[1.4vh] text-[2.2vw] font-semibold text-muted leading-[1.15] align-bottom text-center">
      {children}
    </th>
  );
}

export default function Wettbewerb() {
  return (
    <SlideFrame
      section="WETTBEWERB"
      page="10"
      title="Klard verbindet Verzeichnis-Reichweite mit echter Online-Buchung"
      source="Vergleich nach Funktionsumfang; Wettbewerber beispielhaft."
    >
      <div className="flex-1 flex items-center">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[26vw]" />
            <col className="w-[12vw]" />
            <col className="w-[12vw]" />
            <col className="w-[12vw]" />
            <col className="w-[12vw]" />
            <col className="w-[12vw]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line">
              <th className="px-[0.6vw] py-[1.4vh] text-left text-[2.2vw] font-semibold text-muted align-bottom">
                Angebot
              </th>
              <HeadCell>Online-Buchung</HeadCell>
              <HeadCell>Echtzeit-Termine</HeadCell>
              <HeadCell>Bewertung</HeadCell>
              <HeadCell>KI-Analyse</HeadCell>
              <HeadCell>Zahlung</HeadCell>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="px-[0.6vw] py-[1.6vh] text-[2.4vw] leading-[1.2] text-text">
                Kammer- &amp; dena-Verzeichnisse
              </td>
              <td className="text-center"><Dash /></td>
              <td className="text-center"><Dash /></td>
              <td className="text-center"><Dash /></td>
              <td className="text-center"><Dash /></td>
              <td className="text-center"><Dash /></td>
            </tr>
            <tr className="border-b border-line">
              <td className="px-[0.6vw] py-[1.6vh] text-[2.4vw] leading-[1.2] text-text">
                Ausschreibungsportale
              </td>
              <td className="text-center"><Dash /></td>
              <td className="text-center"><Dash /></td>
              <td className="text-center"><Check /></td>
              <td className="text-center"><Dash /></td>
              <td className="text-center"><Dash /></td>
            </tr>
            <tr className="bg-bluesoft">
              <td className="px-[0.6vw] py-[1.6vh] text-[2.4vw] font-bold text-primary">
                Klard
              </td>
              <td className="text-center"><Check /></td>
              <td className="text-center"><Check /></td>
              <td className="text-center"><Check /></td>
              <td className="text-center"><Check /></td>
              <td className="text-center"><Check /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </SlideFrame>
  );
}
