# 音乐剧歌词网页反馈组件

在音乐剧页面的 `</body>` 前加载共享组件，并传入剧名、收件邮箱和歌曲列表：

```html
<script src="../shared/feedback-widget.js"></script>
<script>
  window.MusicalFeedback.mount({
    id: "show-slug",
    siteName: "音乐剧名称歌词学习",
    recipient: "fulife@agent.qq.com",
    songs: (window.showSongs || []).map((song) => ({
      value: song.id,
      label: `${song.order}. ${song.title}`,
    })),
  });
</script>
```

如果页面已经有自己的“反馈”按钮，可通过 `trigger` 传入 CSS 选择器。组件会隐藏默认悬浮按钮，并使用页面按钮打开同一个反馈弹窗：

```html
<button id="feedbackButton" type="button">反馈</button>
<script>
  window.MusicalFeedback.mount({
    id: "your-musical",
    siteName: "剧目名称",
    recipient: "name@example.com",
    trigger: "#feedbackButton",
    songs: window.lyricsData,
  });
</script>
```

组件默认使用 FormSubmit 的 AJAX 接口，首次提交后需要在收件邮箱中完成服务激活。若以后改用自己的后端，只需传入 `endpoint`，或者传入异步 `transport(payload)` 函数；弹窗和页面接入代码不用修改。

发送按钮仅在反馈内容非空时启用。弹窗支持取消、右上角关闭、点击遮罩关闭和 `Escape` 关闭，并将键盘焦点限制在弹窗内。
