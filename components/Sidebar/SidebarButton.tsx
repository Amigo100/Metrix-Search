import { FC } from 'react';

interface Props {
  text: string;
  icon: JSX.Element;
  onClick: () => void;
  featured?: boolean;
}

export const SidebarButton: FC<Props> = ({ text, icon, onClick, featured }) => {
  return (
    <button
      className={`
        flex w-full items-center gap-3 rounded-md py-3 px-3 text-[14px]
        leading-3 transition-colors duration-200
        text-white
        hover:bg-gray-700
        ${featured ? 'font-semibold' : ''}
      `}
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};
