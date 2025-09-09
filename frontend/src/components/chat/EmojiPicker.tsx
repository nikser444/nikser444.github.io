import React, { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

// Категории эмодзи
const emojiCategories = {
  smileys: {
    name: 'Смайлики',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝',
      '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
      '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁',
      '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
      '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿'
    ]
  },
  people: {
    name: 'Люди',
    icon: '👍',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏',
      '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
      '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '👶', '🧒',
      '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅',
      '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🤴',
      '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹'
    ]
  },
  nature: {
    name: 'Природа',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
      '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖',
      '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈',
      '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒',
      '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕',
      '🐩', '🦮', '🐈', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝',
      '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🌵',
      '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁',
      '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝',
      '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎',
      '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈',
      '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️',
      '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️'
    ]
  },
  food: {
    name: 'Еда',
    icon: '🍎',
    emojis: [
      '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒',
      '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑',
      '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨',
      '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪',
      '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿',
      '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣',
      '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦',
      '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯',
      '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂',
      '🥃', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🏺'
    ]
  },
  activities: {
    name: 'Активности',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸',
      '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋',
      '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
      '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆',
      '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭',
      '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🥁', '🪘', '🎹', '🎷', '🎺',
      '🎸', '🪕', '🎻', '🎲', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎯',
      '🎳', '🎮', '🎰', '🧩'
    ]
  },
  travel: {
    name: 'Путешествия',
    icon: '🚗',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛',
      '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀',
      '🛸', '🚉', '🚊', '🚝', '🚞', '🚋', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈',
      '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🪂', '💺', '🛰️', '🚁', '🛩️',
      '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑',
      '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️',
      '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠', '🏡',
      '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪',
      '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '🕋', '⛩️', '🛤️', '🛣️',
      '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃',
      '🌌', '🌉', '🌁'
    ]
  },
  objects: {
    name: 'Предметы',
    icon: '💎',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽',
      '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
      '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️',
      '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸',
      '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧',
      '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🪚', '🔫', '🧲', '⚔️', '🛡️', '🔪',
      '🗡️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹',
      '🩺', '💊', '💉', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪣', '🧽', '🧴',
      '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞',
      '🪟', '🛍️', '🛒', '🎁', '🎀', '🎊', '🎉', '🎈', '🎄', '🎃', '🎋', '🎍',
      '🎑', '🧧', '🎎', '🎏', '🎐', '🎀', '🥎', '⭐', '🔸', '🔹', '🔶', '🔷',
      '🔺', '🔻', '💠', '🔘', '🔳', '🔲'
    ]
  },
  symbols: {
    name: 'Символы',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '♥️', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️',
      '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎',
      '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶',
      '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵',
      '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔',
      '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭',
      '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱',
      '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️',
      '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄',
      '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️',
      '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣',
      '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣',
      '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬',
      '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️',
      '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶',
      '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️',
      '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠',
      '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶',
      '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨',
      '🟩', '🟦', '🟪', '⬛', '⬜', '🟫'
    ]
  }
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof emojiCategories>('smileys');
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Фильтрация эмодзи по поиску
  const getFilteredEmojis = () => {
    if (!searchTerm) return emojiCategories[activeCategory].emojis;
    
    const allEmojis = Object.values(emojiCategories).flatMap(category => category.emojis);
    return allEmojis.filter(emoji => 
      // Здесь можно добавить поиск по названиям эмодзи
      emoji.includes(searchTerm)
    );
  };

  const recentEmojis = JSON.parse(localStorage.getItem('recentEmojis') || '[]').slice(0, 24);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Добавляем в недавние
    const recent = JSON.parse(localStorage.getItem('recentEmojis') || '[]');
    const filtered = recent.filter((e: string) => e !== emoji);
    const updated = [emoji, ...filtered].slice(0, 24);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));
  };

  return (
    <div
      ref={pickerRef}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-80 h-96 flex flex-col"
    >
      {/* Поиск */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Поиск эмодзи..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Категории */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {recentEmojis.length > 0 && !searchTerm && (
          <button
            onClick={() => setActiveCategory('smileys')}
            className="flex-shrink-0 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 border-transparent hover:border-blue-500"
            title="Недавние"
          >
            🕐
          </button>
        )}
        {Object.entries(emojiCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key as keyof typeof emojiCategories)}
            className={`flex-shrink-0 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-b-2 ${
              activeCategory === key && !searchTerm
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent'
            }`}
            title={category.name}
          >
            {category.icon}
          </button>
        ))}
      </div>

      {/* Эмодзи */}
      <div className="flex-1 p-2 overflow-y-auto">
        {!searchTerm && recentEmojis.length > 0 && activeCategory === 'smileys' && (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Недавние</div>
            <div className="grid grid-cols-8 gap-1 mb-4">
              {recentEmojis.map((emoji: string, index: number) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
          {searchTerm ? `Результаты поиска (${getFilteredEmojis().length})` : emojiCategories[activeCategory].name}
        </div>
        
        <div className="grid grid-cols-8 gap-1">
          {getFilteredEmojis().map((emoji, index) => (
            <button
              key={`${activeCategory}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {getFilteredEmojis().length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="text-2xl mb-2">🤷‍♀️</div>
            <div className="text-sm">Эмодзи не найдены</div>
          </div>
        )}
      </div>

      {/* Футер */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
        Нажмите на эмодзи для добавления
      </div>
    </div>
  );
};

export default EmojiPicker;