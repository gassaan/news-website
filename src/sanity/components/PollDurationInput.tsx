import { type StringInputProps, set, unset } from "sanity";
import { useState } from "react";
import { Button, Flex, Stack, Text } from "@sanity/ui";

// Quick ways to set when a poll stops taking votes, counted from now. The normal
// date and time picker stays underneath for an exact moment.
const DAY = 86400000;
const CHOICES: { label: string; ms: number }[] = [
  { label: "1 ދުވަސް", ms: DAY },
  { label: "3 ދުވަސް", ms: 3 * DAY },
  { label: "1 ހަފްތާ", ms: 7 * DAY },
  { label: "2 ހަފްތާ", ms: 14 * DAY },
  { label: "1 މަސް", ms: 30 * DAY },
];

export default function PollDurationInput(props: StringInputProps) {
  const { value, onChange, readOnly, renderDefault } = props;
  const [openedAt] = useState(() => Date.now());
  const ends = value ? Date.parse(value) : NaN;
  const status = !value
    ? "މުއްދަތެއް ނެތް. ވޯޓު ނުނިމޭނެ."
    : ends <= openedAt
      ? "ވޯޓު ނިމިއްޖެ. ސައިޓުގައި ނަތީޖާ ދައްކަނީ."
      : null;

  return (
    <Stack gap={3}>
      <Flex gap={2} wrap="wrap">
        {CHOICES.map((c) => (
          <Button
            key={c.label}
            text={c.label}
            mode="ghost"
            fontSize={1}
            disabled={readOnly}
            onClick={() => onChange(set(new Date(Date.now() + c.ms).toISOString()))}
          />
        ))}
        <Button text="ނުނިމޭ" mode="ghost" tone="critical" fontSize={1} disabled={readOnly || !value} onClick={() => onChange(unset())} />
      </Flex>
      {renderDefault(props)}
      {status && (
        <Text size={1} muted>
          {status}
        </Text>
      )}
    </Stack>
  );
}
