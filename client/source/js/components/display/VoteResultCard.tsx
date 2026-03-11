import * as React from 'react';
import { Book } from 'types';
import { VoteResultCardBase } from 'components/display/VoteResultCardBase';
import { pointString } from 'utils/strings';

export interface VoteResultCardProps {
  book: Book;
  isSmallScreen?: boolean;
}

export class VoteResultCard extends React.Component<VoteResultCardProps, any> {
  render() {
    const { book, isSmallScreen } = this.props;

    return (
      <VoteResultCardBase
        title={book.title}
        author={book.author}
        image={book && book.links && book.links.image}
        primaryText={pointString(book.points)}
        isSmallScreen={isSmallScreen}
      />
    );
  }
}
