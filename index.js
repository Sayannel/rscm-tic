const savedConfig = {
    players_per_team: undefined,
    skill_range: undefined,
};
let savedPlayers = [];
let savedErrors = [];
let playersGrid;
let errorsGrid;
let teamGenerationTry = 0;
const playerColumns = [
    {id: 'name', name: "Prénom Nom"},
    {id: 'group', name: "Groupe"},
    {id: 'skill', name: "Niveau estimé"},
    {id: 'status', name: "Status"},
    {id: 'delete', width: '90px'}
]
const errorsColumns = [
    {id: 'error', name: 'Erreur', width: '250px'},
    {id: 'data', name: 'Donnée'},
]

const setStep = (stepNumber) => {
    const activeItemClasses = 'active text-primary';
    $('.step').addClass('d-none');
    $(`.step[data-step="${stepNumber}"]`).removeClass('d-none');
    $('#main-breadcrumb .breadcrumb-item').removeClass(activeItemClasses);
    $(`#main-breadcrumb .breadcrumb-item:nth-child(${stepNumber})`).addClass(activeItemClasses);

    if (stepNumber === 4) {
        updatePlayers();
        updateErrors();
        $('#players_count').html(`${savedPlayers.length} joueur.euse.s`);
    }

    if (stepNumber === 5) {
        generateStats();
    }
}

const resetErrors = () => {
    savedErrors = [];
    errorsGrid.updateConfig({
        data: []
    }).forceRender();
}

const getPlayerData = (data) => {
    // Empty line
    if (data.trim().length === 0) {
        return undefined
    }
    const playerData = data.split(',');

    // line format is not good
    if (playerData.length !== 3) {
        return null;
    }

    return {
        data,
        name: playerData[0].trim(),
        group: playerData[1].trim().toUpperCase(),
        skill: parseInt(playerData[2].trim()),
        status: {
            valid: true,
            reason: undefined
        }
    }
}

const checkPlayer = (player) => {
    const playerData = getPlayerData(player);
    if (playerData === undefined) {
        return
    }
    if (playerData === null) {
        return null
    } else if (!['C', 'L'].includes(playerData.group)) {
        playerData.status.valid = false;
        playerData.status.reason = 'groupe invalide';
    } else if (isNaN(playerData.skill) || playerData.skill < 1 || playerData.skill > parseInt($('[name="skill_range"]').val())) {
        playerData.status.valid = false;
        playerData.status.reason = 'niveau invalide';
    } else if (savedPlayers.filter((player) => player.name === playerData.name).length > 0) {
        playerData.status.valid = false;
        playerData.status.reason = 'joueur.euse dupliqué.e';
    }

    return playerData;
}

const getPlayersData = (players) => players.map(
    (player) =>
        [player.name, player.group, player.skill, '✅ validé.e']
)

const removePlayerByIndex = (index) => {
    const playersCount = parseInt(Cookies.get('players_count'));
    for (let i = 0; i < playersCount; i++) {
        Cookies.remove(`player-${i}`);
    }
    Cookies.set('players_count', parseInt(Cookies.get('players_count')) - 1);
    savedPlayers.splice(index, 1);
    for (let i = 0; i < savedPlayers.length; i++) {
        Cookies.set(`player-${i}`, JSON.stringify(savedPlayers[i]));
    }
    updatePlayers()
}

const updatePlayers = () => {
    // Update grid
    playersGrid.updateConfig({
        data: getPlayersData(savedPlayers)
    }).forceRender();

    setTimeout(() => {
        $('#players_list tbody [data-column-id="delete"]').each((index, element) => {
            $(element).html(`<button class="btn btn-sm" onclick="removePlayerByIndex(${index})">❌</button>`)
        })
    }, 500);
}

const updateErrors = () => {
    if (savedErrors.length) {
        $('#errorsWrapper').show();
        errorsGrid.updateConfig({
            data: savedErrors,
        }).forceRender();
    } else {
        $('#errorsWrapper').hide();
    }
}

const addPlayers = (players) => {
    savedPlayers = [...savedPlayers, ...players];

    for (let i = 0; i < savedPlayers.length; i++) {
        Cookies.set(`player-${i}`, JSON.stringify(savedPlayers[i]));
    }
    Cookies.set('players_count', savedPlayers.length);
}

const importPlayers = (players) => {
    const newPlayers = [];
    for (const player of players) {
        const playerFormatted = checkPlayer(player);
        if (playerFormatted === null) {
            savedErrors.push(['❌ donnée invalide', player])
        } else if (playerFormatted !== undefined) {
            if (playerFormatted.status.valid) {
                newPlayers.push(playerFormatted);
            } else {
                savedErrors.push([`❌ ${playerFormatted.status.reason}`, player]);
            }
        }
    }

    // Clear the import field
    $('[name="players"]').val('');
    addPlayers(newPlayers);
}

const getFieldValue = (name) => {
    const field = $(`[name="${name}"]`);
    switch (field.attr('type')) {
        case 'text':
            return field.val().trim()
        case 'number':
            return parseInt(field.val())
        default:
            return field.val()
    }

}

const getFormValues = (fieldNames) => {
    const values = {};
    for (const name of fieldNames) {
        values[name] = getFieldValue(name);
    }
    return values;
}

const removeSavedValues = (playerOnly = false) => {
    const numberOfPlayers = parseInt(Cookies.get('players_count'));
    for (let i = 0; i <= numberOfPlayers; i++) {
        console.log('remove', `player-${i}`);
        Cookies.remove(`player-${i}`);
    }
    Cookies.remove('players_count');
    if (!playerOnly) {
        for (const name of Object.keys(savedConfig)) {
            Cookies.remove(name);
            savedConfig[name] = undefined;
            $(`[name="${name}"]`).val('');
        }
    }
    loadSavedValues();
}

const loadSavedPlayers = () => {
    const playersCount = Cookies.get('players_count');
    if (playersCount === undefined) {
        return []
    } else {
        const players = []
        for (let i = 0; i < parseInt(playersCount); i++) {
            players.push(
                JSON.parse(Cookies.get(`player-${i}`))
            );
        }
        savedPlayers = players
        return players;
    }
}

const loadSavedValues = () => {
    updatePlayers();
    for (const name of Object.keys(savedConfig)) {
        if (Cookies.get(name) === undefined) {
            return false
        }
        const value = Cookies.get(name);
        savedConfig[name] = value;
        $(`[name="${name}"]`).val(value);
    }
    return true
}

const saveValues = (values) => {
    for (const value of Object.entries(values)) {
        Cookies.set(value[0], value[1], {expires: 365});
    }
}

const generateStats = () => {
    $('#table-stats [data-stat="players-totalNumber"]').html(savedPlayers.length);
    $('#table-stats [data-stat="config-teamCount"]').html(savedConfig.players_per_team);
    $('#table-stats [data-stat="config-maxSkill"]').html(savedConfig.skill_range);
}

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const getTeams = (players, playersPerTeam) => {
    players = shuffleArray(players);
    players.sort((a, b) => b.skill - a.skill);

    const numberOfTeams = Math.ceil(players.length / playersPerTeam);
    const teams = Array.from({length: numberOfTeams}, () => []);

    const assignPlayers = (players, teams) => {
        if (players.length === 0) return;

        let lowestSumIndex = 0;
        let lowestSum = Infinity;
        teams.forEach((team, index) => {
            const sum = team.reduce((acc, player) => acc + player.skill, 0);
            if (sum < lowestSum) {
                lowestSum = sum;
                lowestSumIndex = index;
            }
        });

        teams[lowestSumIndex].push(players.shift());
        assignPlayers(players, teams);
    };

    assignPlayers(players, teams);
    return shuffleArray(teams);
};

const getTableColor = (number) => {
    if (number % 6 === 0) return 'primary';
    if (number % 5 === 0) return 'warning';
    if (number % 4 === 0) return 'success';
    if (number % 3 === 0) return 'info';
    if (number % 2 === 0) return 'secondary';
    return 'danger';
};


const generateTeams = () => {
    teamGenerationTry++;
    const teams = getTeams([...savedPlayers], savedConfig.players_per_team);
    $('#teams').append(
        $('<div class="accordion mb-4" />')
            .attr('id', `team-result-${teamGenerationTry}`)
            .html(`
                <div class="team-result accordion-item">
                    <h4 class="accordion-header">
                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#team-content-${teamGenerationTry}" aria-expanded="true" aria-controls="collapseOne">
                         <strong>Génération #${teamGenerationTry}</strong>
                        </button>
                    </h4>
                    <div id="team-content-${teamGenerationTry}" class="accordion-collapse collapse show" data-bs-parent="#team-result-${teamGenerationTry}">
                        <div class="accordion-body">
                        </div>
                    </div>
                </div>
            `)
    );

    setTimeout(() => {
        for (const [number, team] of teams.entries()) {
            $(`#team-result-${teamGenerationTry} .accordion-body`).append(`
                <table class="table table-bordered team-table" id="team-${teamGenerationTry}-${number}">
                    <thead class="table-${getTableColor(number)}">
                        <tr>
                            <th colspan="3">
                                Équipe #${number + 1}
                            </th>
                        </tr>
                        <tbody></tbody>
                    </thead>
                </table>
            `);
        }
    })
    setTimeout(() => {
        for (const [number, team] of teams.entries()) {
            for (const member of team) {
                $(`#team-${teamGenerationTry}-${number} tbody`).append(`
                    <tr>
                        <td>${member.name}</td>
                        <td>${member.group}</td>
                        <td>${member.skill}</td>
                    </tr>
                `);
            }
        }
    })
}

$(document).ready(() => {
    setStep(1);

    $('#resetPlayers').on('click', () => {
        savedPlayers = [];
        removeSavedValues(true);
        setStep(3);
    })

    $('#btn-generate-teams').on('click', () => {
        $('#teams .accordion-collapse').removeClass('show');
        generateTeams();
    });

    $('#btn-validate-players').on('click', () => {
        setStep(5);
    });

    $('#btn-launch-continue').on('click', () => {
        const hasValues = loadSavedValues();
        setStep(hasValues ? 3 : 2);
    });

    $('#btn-launch-new').on('click', () => {
        removeSavedValues();
        setStep(2);
    });

    $('#import').on('submit', (event) => {
        event.preventDefault();
        resetErrors();
        const values = getFormValues(['players']);
        importPlayers(values.players.split('\n'));
        setStep(4);
    });

    $('#setup').on('submit', (event) => {
        event.preventDefault();
        const values = getFormValues(['players_per_team', 'skill_range']);
        savedConfig.players_per_team = values.players_per_team;
        savedConfig.skill_range = values.skill_range;

        saveValues(values);
        setStep(3);
    });

    $('#main-breadcrumb .breadcrumb-item').on('click', (event) => {
        setStep(parseInt($(event.currentTarget).attr('data-step')));
    });

    playersGrid = new gridjs.Grid({
        data: getPlayersData(loadSavedPlayers()),
        columns: playerColumns,
    }).render(document.getElementById("players_list"));

    errorsGrid = new gridjs.Grid({
        data: [],
        columns: errorsColumns,
    }).render(document.getElementById("errors_list"));

    setTimeout(() => {
        loadSavedValues();
    }, 500);
});