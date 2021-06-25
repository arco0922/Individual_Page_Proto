const backend_path = 'https://seisaku10ux.herokuapp.com'; //サーバーのurl
const lobby_path =
    'https://yahoopuyo.github.io/iiie2021_UX/carousel/index.html';
const roomId = '1'; //ここに作品IDを入れて下さい

//サーバーとWebSocket通信を確立
//queryでroomIdを送ることで、サーバー側でsocket.ioにおける該当のRoomにjoinする処理が行われる
const socket = io(`${backend_path}/individual`, {
    query: {
        roomId: roomId,
    },
});

var members = []; //この部屋に参加している全員のsocketIdの配列

const worksElement = document.getElementById('works');

const membersElement = document.getElementById('members');
const createMember = (n_memberId) => {
    if (n_memberId !== socket.id) {
        const people = document.createElement('div');
        const peopleImg = document.createElement('img');
        const peopletype = Math.floor(Math.random() * 8) + 1;
        const gray = Math.random() * 3 + 1;
        const offset =
            50 +
            ((Math.random() - 0.5) * worksElement.offsetWidth * 90) /
                window.innerWidth;
        peopleImg.setAttribute('src', `./assets/people/${peopletype}.png`);
        people.setAttribute('id', n_memberId);
        people.classList.add('member');
        people.style.position = 'absolute';
        people.style.top = '0px';
        people.style.height = '100%';
        peopleImg.style.height = '15vh';
        peopleImg.style.minHeight = '100px';
        peopleImg.style.maxHeight = '160px';
        const w = peopleImg.offsetWidth;
        people.style.left = `calc(${offset}% - ${w}px)`;
        peopleImg.style.filter = `grayScale(1) brightness(${gray})`;
        people.appendChild(peopleImg);
        membersElement.appendChild(people);
        setTimeout(() => people.classList.add('exist'), 10);
    }
};
const deleteMember = (n_memberId) => {
    const people = document.getElementById(n_memberId);
    people.classList.add('gone');
    setTimeout(() => membersElement.removeChild(people), 1000);
};

const updateMembers = (n_members) => {
    n_members.map((member) => {
        if (!members.includes(member)) createMember(member);
    });
    members.map((member) => {
        if (!n_members.includes(member)) deleteMember(member);
    });
    members = n_members;
};

const createMyReaction = (reactionId) => {
    const reactionButtonElement = document.getElementById(
        `ReactButton_${reactionId}`
    );
    const w = reactionButtonElement.offsetWidth;

    const reaction = document.createElement('img');
    reaction.setAttribute('src', `./assets/buttons/Emoji_${reactionId}.png`);
    reaction.classList.add('myReaction');
    reaction.style.display = 'block';
    reaction.style.position = 'absolute';
    reaction.style.top = '0px';
    reaction.style.left = `${w * 0.15}px`;
    reaction.style.width = `${w * 0.7}px`;
    reaction.style.zIndex = '10';
    reactionButtonElement.appendChild(reaction);
    setTimeout(() => reaction.classList.add('disappeared'), 10);
    setTimeout(() => reactionButtonElement.removeChild(reaction), 1500);
};

const createOthersReaction = (senderId, reactionId) => {
    const senderElement = document.getElementById(senderId);
    const reaction = document.createElement('img');
    reaction.setAttribute('src', `./assets/buttons/Emoji_${reactionId}.png`);
    reaction.classList.add('othersReaction');
    reaction.style.display = 'block';
    reaction.style.position = 'absolute';
    reaction.style.top = '20px';
    const w = senderElement.offsetWidth;
    reaction.style.left = `${w / 2 - 20}px`;
    reaction.style.width = '40px';
    reaction.style.zIndex = '10';
    senderElement.appendChild(reaction);
    setTimeout(() => reaction.classList.add('disappeared'), 10);
    setTimeout(() => senderElement.removeChild(reaction), 1500);
};

const reactionButtonElements = document.getElementsByClassName('reactBtn');
for (var i = 0; i < reactionButtonElements.length; i++) {
    const reactionId = reactionButtonElements[i].id.split('_').slice(-1)[0];
    reactionButtonElements[i].addEventListener('click', () => {
        socket.emit('reaction', { reactionId: reactionId });
        createMyReaction(reactionId);
    });
}

const detailBtnElement = document.getElementById('detailBtn');
const topbarElement = document.getElementById('topbar');
const detailElement = document.getElementById('detail');
const detailContentElement = document.getElementById('detailContent');
const arrowIconElement = document.getElementById('arrow_icon');
const arrowTextElement = document.getElementById('arrow_text');

window.addEventListener('resize', () => {
    if (Array.from(topbarElement.classList).includes('isOpen')) {
        const t = worksElement.getBoundingClientRect().top + window.pageYOffset;
        //console.log(t);
        const offset = -t + window.innerHeight * 0.1 - 10;
        topbarElement.style.top = `${offset}px`;
    }
});

detailBtnElement.addEventListener('click', () => {
    if (Array.from(topbarElement.classList).includes('isOpen')) {
        topbarElement.classList.remove('isOpen');
        detailElement.classList.remove('isOpen');
        detailContentElement.classList.remove('isOpen');
        topbarElement.style.top = 'max(-50px, -12vh)';
        arrowIconElement.className = 'fas fa-angle-down fa-position-bottom';
        arrowTextElement.innerHTML = '作品詳細';
    } else {
        const t = worksElement.getBoundingClientRect().top + window.pageYOffset;
        //console.log(t);
        const offset = -t + window.innerHeight * 0.1 - 10;
        topbarElement.classList.add('isOpen');
        detailElement.classList.add('isOpen');
        topbarElement.style.top = `${offset}px`;
        arrowIconElement.className = 'fas fa-times';
        arrowTextElement.innerHTML = '閉じる';

        setTimeout(() => {
            detailContentElement.classList.add('isOpen');
        }, 500);
    }
});

document.getElementById('backToLobbyBtn').addEventListener('click', () => {
    window.location.href = lobby_path;
});

//socket通信が確立したタイミングで、サーバーに対して一度メンバーリストを送信するように要求を行う
socket.on('connect', () => {
    console.log(`connected! ${socket.id}`);
    socket.emit('get-members');
});

//サーバーから個別に部屋のメンバーリストを受け取る(通信が確立した時)
socket.on('members-private', (props) => {
    const received_members = JSON.parse(props.members);
    updateMembers(received_members);
});

//同じ部屋に他の人が入ったした時に、メンバーリストと、新たに参加したメンバーのIDを受け取る
socket.on('members-joined', (props) => {
    const received_members = JSON.parse(props.members);
    updateMembers(received_members);
});

//同じ部屋の他の人が離脱した時に、メンバーリストと、離脱したメンバーのIDを受け取る
socket.on('members-left', (props) => {
    const received_members = JSON.parse(props.members);
    updateMembers(received_members);
});

socket.on('members-reaction', (props) => {
    createOthersReaction(props.senderId, props.reactionId);
});
