"use client";

type SuggestedQuestionsProps = {
  onSelect: (question: string) => void;
};

const questions = [
  {
    service: "NIDA",
    question: "How do I apply for a NIDA ID?",
    icon: "🪪",
  },
  {
    service: "Passport",
    question: "How do I apply for a passport?",
    icon: "🛂",
  },
  {
    service: "Immigration",
    question: "What immigration services are available?",
    icon: "🌍",
  },
];

export default function SuggestedQuestions({
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {questions.map((item) => (
        <button
          key={item.service}
          type="button"
          onClick={() => onSelect(item.question)}
          className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
              {item.icon}
            </div>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-zinc-800">
              {item.service}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold leading-6 text-zinc-800 transition-colors group-hover:text-emerald-700">
            {item.question}
          </p>

          <div className="mt-4 h-1 w-10 rounded-full bg-yellow-400 transition-all duration-300 group-hover:w-16" />
        </button>
      ))}
    </div>
  );
}