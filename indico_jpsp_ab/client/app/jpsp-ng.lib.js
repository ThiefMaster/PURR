

export function get_settings() {
    try {
        return JSON.parse(
            document.querySelector('#jpsp-ng-settings').textContent
        );
    } catch (e) {
        return undefined;
    }
}

export function log_data({ head, body, store }) {
    if (head) store[head.uuid] = store[head.uuid] || {};

    if (["task:queued"].includes(head.code)) {
        store[head.uuid].queued_time = head.time;
    } else if (["task:begin"].includes(head.code)) {
        store[head.uuid].begin_time = head.time;
    } else if (["task:result"].includes(head.code)) {
        store[head.uuid].result_time = head.time;
    } else if (["task:end", "task:error"].includes(head.code)) {
        store[head.uuid].end_time = head.time;

        console.log(
            `[${head.uuid}]`,
            "queued -> end",
            store[head.uuid].end_time - store[head.uuid].queued_time,
            "seconds"
        );

        console.log(
            `[${head.uuid}]`,
            "begin -> end",
            store[head.uuid].end_time - store[head.uuid].begin_time,
            "seconds"
        );

        console.log(
            `[${head.uuid}]`,
            "queued -> begin",
            store[head.uuid].begin_time - store[head.uuid].queued_time,
            "seconds"
        );
    }
}

export function run_handler({ head, body, store }) {
    if (head.code === "task:progress") {
        if (head.uuid in store) {
            if ("progress" in store[head.uuid]) {
                store[head.uuid].progress.call(null, { head, body });
            }
        }
    }
    if (head.code === "task:result") {
        if (head.uuid in store) {
            if ("result" in store[head.uuid]) {
                store[head.uuid].result.call(null, { head, body });
            }
        }
    }

    if (head.code === "task:end") {
        if (head.uuid in store) {
            if ("post" in store[head.uuid]) {
                store[head.uuid].post.call(null, { head, body });
            }
            if ("ws" in store[head.uuid]) {
                store[head.uuid].ws.close();
            }
            delete store[head.uuid];
        }
    }
}

export function get_ulid() {
    const BASE32 = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "J",
        "K",
        "M",
        "N",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "V",
        "W",
        "X",
        "Y",
        "Z",
    ];
    let last = -1;
    /* Pre-allocate work buffers / views */
    let ulid = new Uint8Array(16);
    let time = new DataView(ulid.buffer, 0, 6);
    let rand = new Uint8Array(ulid.buffer, 6, 10);
    let dest = new Array(26);

    function encode(ulid) {
        dest[0] = BASE32[ulid[0] >> 5];
        dest[1] = BASE32[(ulid[0] >> 0) & 0x1f];
        for (let i = 0; i < 3; i++) {
            dest[i * 8 + 2] = BASE32[ulid[i * 5 + 1] >> 3];
            dest[i * 8 + 3] =
                BASE32[((ulid[i * 5 + 1] << 2) | (ulid[i * 5 + 2] >> 6)) & 0x1f];
            dest[i * 8 + 4] = BASE32[(ulid[i * 5 + 2] >> 1) & 0x1f];
            dest[i * 8 + 5] =
                BASE32[((ulid[i * 5 + 2] << 4) | (ulid[i * 5 + 3] >> 4)) & 0x1f];
            dest[i * 8 + 6] =
                BASE32[((ulid[i * 5 + 3] << 1) | (ulid[i * 5 + 4] >> 7)) & 0x1f];
            dest[i * 8 + 7] = BASE32[(ulid[i * 5 + 4] >> 2) & 0x1f];
            dest[i * 8 + 8] =
                BASE32[((ulid[i * 5 + 4] << 3) | (ulid[i * 5 + 5] >> 5)) & 0x1f];
            dest[i * 8 + 9] = BASE32[(ulid[i * 5 + 5] >> 0) & 0x1f];
        }
        return dest.join("");
    }

    return function () {
        let now = Date.now();
        if (now === last) {
            /* 80-bit overflow is so incredibly unlikely that it's not
             * considered as a possiblity here.
             */
            for (let i = 9; i >= 0; i--) if (rand[i]++ < 255) break;
        } else {
            last = now;
            time.setUint16(0, (now / 4294967296.0) | 0);
            time.setUint32(2, now | 0);
            window.crypto.getRandomValues(rand);
        }
        return encode(ulid);
    };
}

