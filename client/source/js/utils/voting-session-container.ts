export function populateVotesWithBooks(list = [], books = {}) {
  return list.map(_ => ({
    ..._,
    book: books[_.book] || _.book,
  }));
}

export function populateVotesWithUsers(list = [], users = {}) {
  return list.map(_ => ({
    ..._,
    user: users[_.user] || _.user,
  }));
}

export function hydrateVotingSession(votingSession = {}, books = {}, users = {}) {
  const votes = populateVotesWithUsers(
    populateVotesWithBooks((votingSession as any).votes || [], books),
    users,
  );
  const results = populateVotesWithBooks((votingSession as any).results || [], books);
  return {
    ...votingSession,
    votes,
    results,
  };
}

export function hasUserVoted(votes = [], myId = null) {
  return votes.some((vote: any) => vote && vote.user && vote.user._id === myId);
}

export function buildVotingParticipation(users = {}, votes = []) {
  let usersHaveVoted: any = votes.reduce((map, vote: any) => {
    if (vote && vote.user && vote.user._id) {
      map[vote.user._id] = true;
    }
    return map;
  }, {});
  let usersHaveNotVoted: any = Object.values(users).reduce((map, user: any) => {
    if (!usersHaveVoted[user._id]) {
      map[user._id] = true;
    }
    return map;
  }, {});
  usersHaveVoted = Object.keys(usersHaveVoted).map(_id => users[_id]).filter(_ => !!_);
  usersHaveNotVoted = Object.keys(usersHaveNotVoted).map(_id => users[_id]).filter(_ => !!_);
  return {
    usersHaveVoted,
    usersHaveNotVoted,
  };
}

export function selectVotingSessionContainerState(state: any) {
  const latestId = state.votingSession.latestWithUserVotesId;
  const latestVotingSession = latestId ? state.votingSession.sessions[latestId] : null;
  return {
    isLoggedIn: state.users.isLoggedIn,
    isAdmin: state.users.isAdmin,
    myId: state.users.myId,
    users: state.users.users || {},
    books: state.books || {},
    votingSession: state.votingSession.currentId ? state.votingSession.sessions[state.votingSession.currentId] : {},
    latestVotingSession,
  };
}
