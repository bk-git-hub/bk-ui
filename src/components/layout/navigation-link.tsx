import React from "react";
import { NavLink } from "react-router-dom";
const navigationLinks = [
  { to: "/", text: "Home", end: true },
  { to: "/components/tinder-slider", text: "Tinder Slider" },
  { to: "/components/coverflow", text: "Coverflow" },
];

const NavigationLink = React.memo(
  ({ onLinkClick }: { onLinkClick: () => void }) => {
    const linkClass =
      "block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors";
    const activeLinkClass = "bg-slate-200 text-slate-900 font-semibold";

    return (
      <nav className="flex flex-col space-y-1">
        {navigationLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onLinkClick}
            className={({ isActive }) =>
              isActive ? `${linkClass} ${activeLinkClass}` : linkClass
            }
          >
            {link.text}
          </NavLink>
        ))}
      </nav>
    );
  },
);

export default NavigationLink;
