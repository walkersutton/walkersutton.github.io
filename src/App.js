import React, { useEffect, useState } from "react";

import LinkList from "./components/LinkList";
import subsackRecentPosts from "./api/substackRecentPosts";
import chronicallyOnlineMap from "./data/chronicallyOnline.json";
import projectsMap from "./data/projects.json";
import dormantProjectsMap from "./data/dormantProjects.json";

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days; i don't write very often

const fetchFromCache = (key) => {
  const cachedData = localStorage.getItem(key);
  if (cachedData) {
    const { timestamp, data } = JSON.parse(cachedData);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
};

const setCache = (data, key) => {
  const cacheData = {
    timestamp: Date.now(),
    data,
  };
  localStorage.setItem(key, JSON.stringify(cacheData));
};

function App() {
  const [writingMap, setWritingMap] = useState(null);

  useEffect(() => {
    const fetchSubstackData = async () => {
      const key = "substackMapCache";
      const cachedData = fetchFromCache(key);
      if (cachedData) {
        setWritingMap(cachedData);
        return;
      }
      try {
        const map = await subsackRecentPosts();
        setWritingMap(map);
        setCache(map, key);
      } catch (error) {
        console.log("Error fetching Substack posts");
      }
    };
    fetchSubstackData();
  }, []);

  return (
    <>
      <header>
        <h1>walker sutton</h1>
      </header>
      <main>
        <h2>Active Projects</h2>
        <LinkList map={projectsMap} />
        <h2>Dormant Projects</h2>
        <LinkList map={dormantProjectsMap} />
        <h2>Writing</h2>
        {writingMap && <LinkList map={writingMap} />}
      </main>
      <footer>
        <LinkList map={chronicallyOnlineMap} className="horiz-list" />
      </footer>
    </>
  );
}

export default App;