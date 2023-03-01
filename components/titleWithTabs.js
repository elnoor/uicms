import { useMemo, useState } from "react";
import Link from "next/link";
import { ImArrowUpRight2 } from "react-icons/im";
import styles from "@/styles/TitleWithTabs.module.scss";

export default function TitleWithTabs({
  title,
  subtitle,
  tabs = [], // {text, icon, skip, (href | onClick | content)}
  className = "",
  defaultTab = 0,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // index

  const filteredTabs = useMemo(
    () => (tabs.length === 0 ? tabs : tabs.filter((t) => !t.skip)),
    [tabs]
  );

  return (
    <>
      <div
        className={`is-flex has-background-white-bis flex-dir-col-sm x-scrollable mt-n4 ${styles.titleWithTabs} ${className}`}
      >
        {title && (
          <div className="is-align-self-center w-100-sm">
            <p className="title is-5 pr-6 is-text-overflow">{title}</p>
          </div>
        )}
        {subtitle && (
          <div className="is-align-self-center w-100">
            <p className="subtitle is-6 is-text-overflow">{subtitle}</p>
          </div>
        )}
        {filteredTabs.length > 0 && (
          <div className="mt-3-sm">
            <div className={`tabs ${styles.tabs}`}>
              <ul>
                {filteredTabs.map((tab, index) => {
                  const icon = tab.icon && (
                    <span className="icon is-small" style={{ marginLeft: 0 }}>
                      {tab.icon}
                    </span>
                  );
                  return (
                    <li
                      key={index}
                      className={activeTab === index ? "is-active" : ""}
                    >
                      {tab.href ? (
                        <LinkWithHref
                          href={tab.href}
                          icon={icon}
                          text={tab.text}
                        />
                      ) : (
                        <a
                          onClick={() =>
                            tab.content ? setActiveTab(index) : tab.onClick()
                          }
                        >
                          {icon}
                          {tab.text}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
      {filteredTabs.length > 0 && filteredTabs[activeTab].content}
    </>
  );
}

function LinkWithHref({ href, icon, text }) {
  const external = href.startsWith("http");
  return (
    <Link href={href} target={external ? "_blank" : ""}>
      {icon}
      {text}
      {external && (
        <span className="icon is-small">
          <ImArrowUpRight2 />
        </span>
      )}
    </Link>
  );
}
