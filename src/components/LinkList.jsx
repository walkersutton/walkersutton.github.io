function LinkList({ map, className }) {
  return (
    <ul className={className}>
      {Object.keys(map).map((key, index) => {
        return !key.startsWith("hide") ? (
          <li key={index}>
            <a href={map[key]}>{key}</a>
          </li>
        ) : null;
      })}
    </ul>
  );
}

export default LinkList;
