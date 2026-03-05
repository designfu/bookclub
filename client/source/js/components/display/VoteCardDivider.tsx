import * as React from 'react';
import Card from '@material-ui/core/Card';

export interface VoteCardDividerProps {
}

export class VoteCardDivider extends React.Component<VoteCardDividerProps, any> {
  render() {
    return (
      <Card
        className='c-vote-card c-vote-card--divider'
        elevation={0}
        style={{ backgroundColor: 'transparent' }}
      >
        <div className='c-vote-card__padded'>
          <div className='c-vote-card__details'>
            <span className='c-vote-card__no-interest-divider'>
              <span className='c-vote-card__no-interest-label'>NO INTEREST BELOW THIS LINE</span>
            </span>
          </div>
        </div>
      </Card>
    );
  }
}
