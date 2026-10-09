import { SaveIcon } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslate } from "ra-core";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { Tag } from "../types";
import { colors } from "./colors";
import { RoundButton } from "./RoundButton";
import { useTags } from "./useTags";
import { normalizeTagColor, normalizeTagName } from "./tagUtils";

type TagFormProps = {
  open: boolean;
  cancelLabel?: string;
  tag?: Pick<Tag, "id" | "name" | "color">;
  onCancel?(): void;
  onSubmit(tag: Pick<Tag, "name" | "color">): Promise<void>;
};

export function TagForm({
  open,
  cancelLabel,
  tag,
  onCancel,
  onSubmit,
}: TagFormProps) {
  const translate = useTranslate();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(colors[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: tags = [], isPending: isPendingTags } = useTags({
    enabled: open,
  });
  const nameConflict = tags.some(
    (existingTag) =>
      existingTag.id !== tag?.id &&
      normalizeTagName(existingTag.name) === normalizeTagName(newTagName),
  );
  const colorIsInUse = (color: string) =>
    tags.some(
      (existingTag) =>
        existingTag.id !== tag?.id &&
        normalizeTagColor(existingTag.color) === normalizeTagColor(color),
    );
  const colorConflict = colorIsInUse(newTagColor);

  const handleNewTagNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewTagName(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({ name: newTagName.trim(), color: newTagColor });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setNewTagName(tag?.name ?? "");
    setNewTagColor(tag?.color ?? colors[0]);
    setIsSubmitting(false);
  }, [open, tag]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="tag-name">
            {translate("resources.tags.dialog.name_label")}
          </Label>
          <Input
            id="tag-name"
            autoFocus
            value={newTagName}
            onChange={handleNewTagNameChange}
            placeholder={translate("resources.tags.dialog.name_placeholder")}
            aria-invalid={nameConflict}
          />
          {nameConflict ? (
            <p className="text-sm text-destructive" role="alert">
              {translate("resources.tags.dialog.duplicate_name")}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>{translate("resources.tags.dialog.color")}</Label>
          <div className="flex flex-wrap">
            {colors.map((color) => (
              <RoundButton
                key={color}
                color={color}
                selected={color === newTagColor}
                disabled={colorIsInUse(color)}
                aria-label={color}
                title={
                  colorIsInUse(color)
                    ? translate("resources.tags.dialog.color_in_use")
                    : color
                }
                handleClick={() => {
                  setNewTagColor(color);
                }}
              />
            ))}
          </div>
          {colorConflict ? (
            <p className="text-sm text-destructive" role="alert">
              {translate("resources.tags.dialog.duplicate_color")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel ?? translate("ra.action.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          variant="outline"
          disabled={
            isSubmitting ||
            isPendingTags ||
            !newTagName.trim() ||
            nameConflict ||
            colorConflict
          }
          className={cn(
            buttonVariants({ variant: "outline" }),
            "text-primary",
            isSubmitting ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <SaveIcon />
          {translate("ra.action.save")}
        </Button>
      </div>
    </form>
  );
}
