import { useRef, useState } from "react";
import { daysBetween } from "@/lib/calculations";
import { isDate } from "@/lib/storage";

export function validateFields(form: HTMLFormElement) {
  const errors: Record<string, string> = {};
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement) || !element.name) continue;
    const validity = element.validity;
    if (
      validity.valueMissing ||
      (element.name === "name" && !element.value.trim())
    )
      errors[element.name] = "Preencha este campo.";
    else if (validity.badInput || validity.typeMismatch)
      errors[element.name] = "Informe um valor válido.";
    else if (validity.rangeUnderflow)
      errors[element.name] = `Use um valor de pelo menos ${element.min}.`;
    else if (validity.rangeOverflow)
      errors[element.name] = `Use um valor de até ${element.max}.`;
    else if (validity.stepMismatch)
      errors[element.name] =
        element.name === "months"
          ? "Use um número inteiro de meses."
          : "Use no máximo duas casas decimais.";
    else if (element.type === "date" && !isDate(element.value))
      errors[element.name] = "Informe uma data válida.";
  }
  const data = new FormData(form);
  const start = data.get("purchaseDate"),
    end = data.get("endDate");
  if (isDate(start) && isDate(end)) {
    const days = daysBetween(start, end);
    if (days <= 0)
      errors.endDate = "O vencimento deve ser posterior à aplicação.";
    else if (days > 36525) errors.endDate = "O prazo máximo é de 100 anos.";
  }
  return errors;
}

export function useFormErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const touched = useRef(new Set<string>());
  function update(form: HTMLFormElement, name?: string) {
    if (name) touched.current.add(name);
    const next = validateFields(form);
    setErrors(
      Object.fromEntries(
        Object.entries(next).filter(([key]) => touched.current.has(key)),
      ),
    );
  }
  function submit(form: HTMLFormElement) {
    const next = validateFields(form);
    setErrors(next);
    Object.keys(next).forEach((name) => touched.current.add(name));
    const firstName = Object.keys(next)[0];
    const first = firstName
      ? (form.elements.namedItem(firstName) as HTMLInputElement | null)
      : null;
    if (first) {
      let parent = first.parentElement;
      while (parent && parent !== form) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      first.focus();
    }
    return Object.keys(next).length === 0;
  }
  return { errors, update, submit };
}
