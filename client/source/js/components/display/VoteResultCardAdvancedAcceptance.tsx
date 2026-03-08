import * as React from 'react';
import { Book } from 'types';
import { VoteResultCardBase } from 'components/display/VoteResultCardBase';
import { acceptanceVoteResultsString } from 'utils/strings';

export interface VoteResultCardAdvancedAcceptanceProps {
  book: Book;
  isSmallScreen?: boolean;
}

export class VoteResultCardAdvancedAcceptance extends React.Component<VoteResultCardAdvancedAcceptanceProps, any> {
  render() {
    const { book, isSmallScreen } = this.props;
    const secondaryText = book.tiedCount > 1
      ? `${book.method} ${book.tiedCount}`
      : book.method;

    return (
      <VoteResultCardBase
        title={book.title}
        author={book.author}
        image={book && book.links && book.links.image}
        primaryText={acceptanceVoteResultsString(book.rankings)}
        secondaryText={secondaryText}
        isSmallScreen={isSmallScreen}
        isDeletedPlaceholder={!!(book as any).isDeletedPlaceholder}
      />
    );
  }
}
