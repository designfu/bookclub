import * as React from 'react';
import Typography from '@material-ui/core/Typography';
import { toStandardString } from 'utils/dates';

export const RatingDescriptions = [
  `5 - I would recommend this book to everyone - regardless of their interested in the genre. Everyone should read this book.`,
  `4 - I would recommend this book to someone interested in the genre.`,
  `3 - Good book to read if you have the time.`,
  `2 - Don't recommend. It was ok.`,
  `1 - I didn't like it, and no one should read this book.`,
];

export function getUserRating(book, myId?): number {
  if(!myId) return -1;
  const rating = book ? book.ratings.find(rating => rating.user === myId) : null;
  return rating ? rating.value : -1;
}

export function renderSeasonInfoDate(label, timestamp) {
  return <Typography component='p' className='c-season-info__date'>
    <label>{label}: </label>
    <span>{toStandardString(timestamp)}</span>
  </Typography>;
}

export function ensureSeasonInfoProps(props: any) {
  return {
    season: {
      dates: {
        created: null,
        ...props.season.dates,
      },
      ...props.season,
    },
    votingSession: {
      ...props.votingSession,
      status: null,
    },
    startVotingOpen: props.hasOwnProperty('startVotingOpen') ? props.startVotingOpen : true,
    ...props,
  };
}
