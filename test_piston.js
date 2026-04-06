fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        language: "python",
        version: "*",
        files: [{ content: "print('hello')" }]
    })
}).then(res => res.json()).then(console.log).catch(console.error);
