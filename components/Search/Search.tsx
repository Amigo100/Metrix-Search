import { IconX } from '@tabler/icons-react';
import { FC } from 'react';
import { useTranslation } from 'next-i18next';

interface Props {
  placeholder: string;
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
}

const Search: FC<Props> = ({ placeholder, searchTerm, onSearch }) => {
  const { t } = useTranslation('sidebar');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const clearSearch = () => {
    onSearch('');
  };

  return (
    <div className="relative flex items-center my-2">
      <input
        className="
          w-full rounded-md border border-white/20 
          bg-white 
          py-2 px-4 pr-10
          text-sm text-black
          placeholder-black 
          focus:outline-none
        "
        type="text"
        placeholder={t(placeholder) || ''}
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {searchTerm && (
        <IconX
          className="absolute right-3 cursor-pointer text-black hover:text-black"
          size={18}
          onClick={clearSearch}
        />
      )}
    </div>
  );
};

export default Search;
