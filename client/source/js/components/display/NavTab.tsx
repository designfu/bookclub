import * as React from 'react';
import classnames from 'classnames';
import { Link, useLocation } from 'react-router-dom';

export interface NavTabProps {
  to: string;
}

export function NavTab(props: React.PropsWithChildren<NavTabProps>) {
  const location = useLocation();
  const isActive = location.pathname === props.to;
  const className = classnames('c-nav-tab', {
    'is-active': isActive,
  });

  return (
    <li className={className}>
      <Link to={props.to}>
        {props.children}
      </Link>
    </li>
  );
}
