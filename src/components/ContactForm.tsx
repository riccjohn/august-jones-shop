"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormState = "idle" | "submitting" | "success" | "error";

type FormOption = { value: string; label: string };

const PIECE_TYPES: FormOption[] = [
  { value: "fanny-pack", label: "Fanny Pack ($85–$115)" },
  { value: "cropped-flannel", label: "Cropped Flannel ($110–$145)" },
  {
    value: "cropped-military-jacket",
    label: "Cropped Military Jacket ($195–$245)",
  },
  {
    value: "full-length-military-jacket",
    label: "Full Length Military Jacket ($195–$245)",
  },
  { value: "vest", label: "Vest ($285–$350)" },
];

const ONE_SIZE_VALUE = "one-size";
const FANNY_PACK_VALUE = "fanny-pack";

const SIZE_OPTIONS: FormOption[] = [
  { value: ONE_SIZE_VALUE, label: "One Size (Fanny Packs)" },
  { value: "unisex-s", label: "Unisex S" },
  { value: "unisex-m", label: "Unisex M" },
  { value: "unisex-l", label: "Unisex L" },
  { value: "unisex-xl", label: "Unisex XL" },
  {
    value: "custom-other",
    label: "Custom / Other (Leave details in your description)",
  },
];

const MATERIALS_SOURCE_OPTIONS: FormOption[] = [
  { value: "self", label: "I am sending you my own garments/materials." },
  {
    value: "source",
    label: "I want you to source the vintage materials for me.",
  },
];

function visibleSizeOptions(pieceType: string) {
  if (pieceType === FANNY_PACK_VALUE) {
    return SIZE_OPTIONS.filter((option) => option.value === ONE_SIZE_VALUE);
  }
  if (!pieceType) {
    return SIZE_OPTIONS;
  }
  return SIZE_OPTIONS.filter((option) => option.value !== ONE_SIZE_VALUE);
}

function pieceTypeLabel(value: string) {
  const match = PIECE_TYPES.find((p) => p.value === value);
  return match ? match.label.replace(/\s*\([^)]*\)\s*$/, "") : value;
}

function optionLabel(options: FormOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [pieceType, setPieceType] = useState("");
  const [size, setSize] = useState("");

  const sizeOptions = visibleSizeOptions(pieceType);
  const disabled = state === "submitting";
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === "success") {
      successRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [state]);

  function handlePieceTypeChange(value: string) {
    setPieceType(value);

    if (value === FANNY_PACK_VALUE) {
      setSize(ONE_SIZE_VALUE);
      return;
    }

    const stillVisible = visibleSizeOptions(value).some(
      (option) => option.value === size,
    );
    if (!stillVisible) {
      setSize("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const honeypot = formData.get("website") as string;
    if (honeypot) {
      setState("success");
      return;
    }

    setState("submitting");

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      instagram: formData.get("instagram") as string,
      team: formData.get("team") as string,
      pieceType: pieceTypeLabel(pieceType),
      size: optionLabel(SIZE_OPTIONS, formData.get("size") as string),
      materialsSource: optionLabel(
        MATERIALS_SOURCE_OPTIONS,
        formData.get("materialsSource") as string,
      ),
      message: formData.get("message") as string,
      policyAgreed: formData.get("policyAgreed") === "on",
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setState("success");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div
        ref={successRef}
        className="scroll-mt-24 rounded-sm border border-accent/30 bg-accent/10 px-6 py-10 text-center"
      >
        <p className="font-bebas-neue text-2xl tracking-wider text-foreground sm:text-3xl">
          Request Received
        </p>
        <p className="mt-3 text-sm/relaxed text-muted-foreground sm:text-base">
          Thanks for pitching your idea! I can't wait to read through your
          request and will get back to you via email soon to discuss the
          details.
        </p>
      </div>
    );
  }

  return (
    <>
      <h2
        id="form-heading"
        className="text-display mb-10 text-foreground"
        style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Send a Message
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] top-[-9999px] overflow-hidden"
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Jane"
              required
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Doe"
              required
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input
              id="instagram"
              name="instagram"
              type="text"
              placeholder="@yourhandle"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="team">
            What Team or University are we celebrating?
          </Label>
          <Input
            id="team"
            name="team"
            type="text"
            placeholder="e.g. Wisconsin Badgers"
            required
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pieceType">What type of piece are we creating?</Label>
          <Select
            name="pieceType"
            required
            disabled={disabled}
            value={pieceType}
            onValueChange={handlePieceTypeChange}
          >
            <SelectTrigger id="pieceType" className="w-full">
              <SelectValue placeholder="Choose a piece type" />
            </SelectTrigger>
            <SelectContent>
              {PIECE_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-foreground">
            What size are we aiming for?
          </legend>
          <RadioGroup
            name="size"
            required
            disabled={disabled}
            value={size}
            onValueChange={setSize}
            className="gap-3"
          >
            {sizeOptions.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={option.value}
                  id={`size-${option.value}`}
                />
                <Label htmlFor={`size-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-foreground">
            Are you providing the baseline vintage materials, or would you like
            me to source them?
          </legend>
          <RadioGroup
            name="materialsSource"
            required
            disabled={disabled}
            className="gap-3"
          >
            {MATERIALS_SOURCE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={option.value}
                  id={`materials-${option.value}`}
                />
                <Label
                  htmlFor={`materials-${option.value}`}
                  className="font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="message">Description</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Include style, inspiration from my Instagram or shop, or any other details. Optional, but details help!"
            rows={6}
            disabled={disabled}
          />
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="policyAgreed"
            name="policyAgreed"
            required
            disabled={disabled}
          />
          <Label
            htmlFor="policyAgreed"
            className="block font-normal leading-snug"
          >
            I have read the{" "}
            <a
              href="#terms"
              className="text-foreground underline underline-offset-4 hover:text-accent hover:no-underline transition-colors duration-200"
            >
              custom policy
            </a>{" "}
            below and understand that if my custom design is accepted, a 50%
            non-refundable deposit is required to secure my spot before
            production begins.
          </Label>
        </div>

        {state === "error" && (
          <p className="text-sm text-red-600">
            Something went wrong. Try emailing{" "}
            <a
              href="mailto:customs@augustjones.shop"
              className="underline hover:no-underline"
            >
              customs@augustjones.shop
            </a>{" "}
            directly.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          variant="brand"
          disabled={disabled}
          className="h-14 w-full text-base font-medium uppercase tracking-widest sm:w-auto sm:px-12"
        >
          {state === "submitting" ? "Sending..." : "Request a Custom"}
        </Button>
      </form>
    </>
  );
}
