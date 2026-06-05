import { Link, useLocation } from "react-router";
import { HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";


const sidebarSections = [
  {
    title: "Dashboard",
    items: [
      { name: "Ecommerce", path: "/" },
    ],
  },
  {
    title: "Tables",
    items: [
      { name: "Users", path: "/admin/users" },
      { name: "Pairs", path: "/admin/pairs" },
      { name: "Alerts", path: "/admin/alerts" },
    ],
  },
  {
    title: "Pages",
    items: [
      { name: "Settings", path: "/admin/settings" },
      { name: "Monitor", path: "/admin/monitor" },
      { name: "Performance", path: "/admin/performance" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="no-scrollbar flex flex-col overflow-y-auto">
              {sidebarSections.map((section) => (
                <div key={section.title} className="mb-7">
                  <h3 className="mb-2 px-3 text-xs font-medium text-gray-800 dark:text-white/90">
                    {section.title}
                  </h3>
                  <ul className="flex flex-col gap-0.5">
                    {section.items.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.path}
                          className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                            isActive(item.path)
                              ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                              : "text-gray-700 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800"
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <HorizontaLDots className="size-6 mx-auto" />
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
