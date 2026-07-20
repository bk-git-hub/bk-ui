import React from "react";
import { NavLink } from "react-router-dom";

const homeLink = { to: "/", text: "Home", end: true };

const navigationSections = [
  {
    title: "Components",
    links: [
      { to: "/components/tinder-swiper", text: "Tinder Swiper" },
      { to: "/components/coverflow", text: "Coverflow" },
      { to: "/components/react-pod", text: "ReactPod" },
      { to: "/components/cards-stack-slider", text: "Cards Stack Slider" },
      { to: "/components/shader-slider", text: "Shader Slider" },
      { to: "/components/slicer-slider", text: "Slicer Slider" },
      { to: "/components/shutter-slider", text: "Shutter Slider" },
      { to: "/components/story-slider", text: "Story Slider" },
      { to: "/components/expo-slider", text: "Expo Slider" },
    ],
  },
  {
    title: "For Fun",
    links: [
      { to: "/components/lotto", text: "Lotto Draw" },
      { to: "/components/slot-machine", text: "Slot Machine" },
      { to: "/components/baccarat-squeeze", text: "Baccarat Squeeze" },
    ],
  },
];

const NavigationLink = React.memo(
  ({ onLinkClick }: { onLinkClick: () => void }) => {
    const linkClass =
      "block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors";
    const activeLinkClass = "bg-slate-200 text-slate-900 font-semibold";
    const sectionLabelClass =
      "px-3 pt-5 pb-2 text-xs font-bold tracking-[0.16em] text-slate-400 uppercase";

    return (
      <nav className="flex flex-col" aria-label="Main navigation">
        <NavLink
          to={homeLink.to}
          end={homeLink.end}
          onClick={onLinkClick}
          className={({ isActive }) =>
            isActive ? `${linkClass} ${activeLinkClass}` : linkClass
          }
        >
          {homeLink.text}
        </NavLink>

        {navigationSections.map((section) => {
          const sectionId = `${section.title.toLowerCase().replace(/\s+/g, "-")}-nav`;

          return (
            <section key={section.title} aria-labelledby={sectionId}>
              <h2 id={sectionId} className={sectionLabelClass}>
                {section.title}
              </h2>
              <div className="flex flex-col space-y-1">
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      isActive ? `${linkClass} ${activeLinkClass}` : linkClass
                    }
                  >
                    {link.text}
                  </NavLink>
                ))}
              </div>
            </section>
          );
        })}
      </nav>
    );
  },
);

export default NavigationLink;
