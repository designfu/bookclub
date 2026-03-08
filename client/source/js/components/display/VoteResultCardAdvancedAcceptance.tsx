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

    return (
      <VoteResultCardBase
        title={book.title}
        author={book.author}
        image={book && book.links && book.links.image}
        primaryText={acceptanceVoteResultsString(book.rankings)}
        secondaryText={`${book.method} ${book.tiedCount}`}
        isSmallScreen={isSmallScreen}
      />
    );
  }
}
