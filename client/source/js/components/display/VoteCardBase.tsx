import * as React from 'react';
import { VoteCardLayout } from 'components/display/VoteCardLayout';

export interface VoteCardBaseProps {
  title: string;
  author?: string;
  image?: string;
  trailingContent?: React.ReactNode;
  elevation?: number;
  sx?: any;
  resetAdded?: boolean;
}

export function VoteCardBase({
  title,
  author,
  image,
  trailingContent,
  elevation,
  sx,
  resetAdded = false,
}: VoteCardBaseProps) {
  return (
    <VoteCardLayout
      title={title}
      author={author}
      image={image}
      trailingContent={trailingContent}
      elevation={elevation}
      cardSx={{
        cursor: 'move',
        ...(resetAdded ? { backgroundColor: '#e8f5e9' } : {}),
        ...sx,
      }}
    />
  );
}
