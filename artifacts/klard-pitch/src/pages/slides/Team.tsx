import { SlideFrame } from "@/components/SlideFrame";

function Member({
  initials,
  name,
  role,
  text,
}: {
  initials: string;
  name: string;
  role: string;
  text: string;
}) {
  return (
    <div className="bg-card border border-line p-[2.4vw] rounded-[0.6vw] flex flex-col">
      <div className="flex items-center gap-[1.6vw]">
        <div className="w-[5.5vw] h-[5.5vw] flex-none rounded-full klard-gradient flex items-center justify-center text-white text-[2.4vw] font-bold">
          {initials}
        </div>
        <div>
          <h3 className="text-[2.7vw] font-bold text-deep leading-tight">
            {name}
          </h3>
          <p className="text-[2.2vw] text-primary font-semibold leading-tight">
            {role}
          </p>
        </div>
      </div>
      <p className="mt-[2.4vh] text-[2.4vw] leading-[1.34] text-muted">{text}</p>
    </div>
  );
}

export default function Team() {
  return (
    <SlideFrame
      section="TEAM"
      page="12"
      title="Gründer mit Branchen- und Software-Erfahrung führen Klard"
      source="Branchenzugang trifft Produktentwicklung."
    >
      <div className="grid grid-cols-2 gap-[2.6vw] flex-1 items-center">
        <Member
          initials="MD"
          name="Mürsel Demir"
          role="Gründer & Geschäftsführer"
          text="Ingenieur und seit acht Jahren Energie-Effizienz-Experte. Erfahrung in Gründung, Teamaufbau und Vertrieb – mit direktem Zugang zur Beraterbranche."
        />
        <Member
          initials="IL"
          name="Imad Labbadia"
          role="CTO"
          text="Zwölf Jahre Software-Entwicklung, unter anderem als Gründer von Gutachtery24. Verantwortet Produkt, Plattform und Technologie."
        />
      </div>
    </SlideFrame>
  );
}
