import type { ChallengeType } from "@prisma/client";

type AnswerOption = {
  id: string;
  text: string;
  value?: string;
};

export function AnswerField({
  name,
  type,
  options
}: {
  name: string;
  type: ChallengeType;
  options: AnswerOption[];
}) {
  if (type === "SHORT_ANSWER") {
    return (
      <textarea
        name={name}
        required
        className="mt-4 min-h-28 w-full rounded-lg border-2 border-slate-200 p-3 font-semibold leading-6"
        placeholder="Tulis jawabanmu di sini"
      />
    );
  }

  const visibleOptions: AnswerOption[] = type === "TRUE_FALSE" && !options.length
    ? ["Benar", "Salah"].map((text, index) => ({ id: `${name}-${index}`, text }))
    : options;

  return (
    <div className="mt-4 grid gap-2">
      {visibleOptions.map((option) => (
        <label key={option.id} className="flex min-h-12 items-center gap-3 rounded-lg border-2 border-slate-200 bg-white px-4 font-bold text-ink">
          <input type="radio" name={name} value={option.value || option.text} required />
          {option.text}
        </label>
      ))}
    </div>
  );
}
