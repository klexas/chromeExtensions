const infoArea = document.getElementById("infoArea");
let bookmarks = [];
let proxyUrl = "http://localhost:4242"; // Default

const logAllChildren = async (bookmark) => {
  bookmark.forEach(async (child) => {
    if (child?.children) {
      child.children.forEach(async (child) => {
        if (child.url) bookmarks.push(child);
        else await logAllChildren(child.children);
      });
    }
  });
  return true;
};

const readAllBookmarks = async () => {
  await chrome.bookmarks.getTree(async (tree) => {
    await logAllChildren(tree);
  });
  return true;
};

const printAllBookmarks = async () => {
  bookmarks.forEach((ch) => {
    infoArea.innerHTML += `<br /><a href="${ch.url}">${ch.title}</a><br>`;
  });
  return true;
};

document.getElementById("cache_all").addEventListener("click", async () => {
  infoArea.innerHTML = "<br />Caching bookmarks..";
  await readAllBookmarks();
  setTimeout(async () => {
    await printAllBookmarks();
    // async doesn't seem to play well in extensions. i.e - doesn't seem to wait, even with an inferred return type. 
    await saveAllBookmarks();
  }, 5000); // Weirdness workaround
});

const saveAllBookmarks = async () => {
  infoArea.innerHTML += "<br />Stage 2<br />";
  bookmarks?.forEach(async (bookmark) => {
    await cacheBookmark(bookmark);
  });
  return true;
};

const cacheBookmark = async (bookmark) => {
    chrome.tabs.query({'active': true}, function (tabs) {
        var url = tabs[0].url;
    });

  const proxyUrl = `${proxyUrl}/?url=`+bookmark.url;
  const htmlContent = await fetch(proxyUrl);

  const html = await htmlContent.text();

  // for posterity
  const htmlWithArchiveLinks = html.replace(
    /https:\/\/(?!web.archive.org)/g,
    "https://web.archive.org/web/*/"
  );

  localStorage.setItem(bookmark.id, htmlWithArchiveLinks);
  infoArea.innerHTML += `<br />Cached ${bookmark.title}`;
  return true;
};
