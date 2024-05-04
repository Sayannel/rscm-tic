const savedConfig = {
    players_per_team: undefined,
    skill_range: undefined,
};
let savedPlayers = [];
let savedErrors = [];
let savedTeams = [];
let playersGrid;
let errorsGrid;
let bulkSelection = [];
let trade = [];
const playerColumns = [
    {id: 'bulk', width: '58px'},
    {id: 'name', name: "Prénom Nom", sort: true},
    {id: 'skill', name: "Niveau estimé", sort: true},
    {id: 'gender', name: 'Genre', width: '150px', sort: true},
    {id: 'actions', width: '90px'}
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

    if (stepNumber === 3) {
        updatePlayers();
        updateErrors();
    }

    if (stepNumber === 4) {
        generateStats();
        generateHats();
    }

    if (stepNumber === 5) {
        exportTeams()
    }
}

const exportTeams = () => {
    let teamNumber = 1;
    for (const team of savedTeams) {
        let members = '';
        for (const member of team) {
            members+= `<tr><td>${member.name}</td></tr>`;
        }
        $('#export-teams').append(`
            <div class="col col-md-4">
                <table class="table table-bordered">
                    <thead class="table-secondary">
                        <tr>
                            <th>Équipe ${teamNumber}</th>
                        </tr>
                    </thead>
                    <tbody>${members}</tbody>
                </table>
            </div>
        `);
        teamNumber ++;
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

    const playerData = data.split(data.indexOf(',') >= 0 ? ',' : '\t');

    // line format is not good
    if (playerData.length !== 2 && playerData.length !== 3) {
        return null;
    }

    let gender = playerData.length === 3 ? playerData[2].toLowerCase().trim() : 'male';
    if (gender === 'f') {
        gender = 'female';
    } else if (gender === 'n') {
        gender = 'neutral';
    }

    return {
        data,
        gender,
        name: playerData[0].trim(),
        skill: parseInt(playerData[1].trim()),
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
    } else if (isNaN(playerData.skill) || playerData.skill < 1 || playerData.skill > parseInt($('[name="skill_range"]').val())) {
        playerData.status.valid = false;
        playerData.status.reason = 'niveau invalide';
    } else if (savedPlayers.filter((player) => player.name === playerData.name).length > 0) {
        playerData.status.valid = false;
        playerData.status.reason = 'joueur.euse dupliqué.e';
    }

    return playerData;
}

const getPlayerGenderSymbol = (gender) => {
    switch (gender) {
        case 'male':
            return '♂';
        case 'female':
            return '♀';
        default:
            return '⚥';
    }
}

const getPlayersData = (players) => players.map(
    (player) =>
        ['', player.name, player.skill, getPlayerGenderSymbol(player.gender)]
)

const removePlayerByIndex = (index) => {
    savedPlayers.splice(index, 1);
    updatePlayers();
}

const updatePlayerByIndex = (index) => {
    delete savedPlayers[index];
    const playerData = checkPlayer($('#update-player').val());
    const currentData = savedPlayers[index];
    if (playerData.status.valid) {
        savedPlayers[index] = playerData;
        updatePlayers();
    } else {
        savedPlayers[index] = currentData;
        alert('Données incorrectes', playerData.status.reason);
    }
}

const editPlayerByIndex = (index) => {
    const row = $(`#players_list table tbody > tr:nth-child(${index + 1})`);
    const nameCell = row.find('[data-column-id="name"]').html().split(' ');
    const skill = parseInt(row.find('[data-column-id="skill"]').html());
    const name = nameCell.join(' ');

    row.find('[data-column-id="name"]').empty().attr('colspan', 3);
    row.find('[data-column-id="skill"]').remove();
    row.find('[data-column-id="gender"]').remove();
    row.find('[data-column-id="name"]').append(`
        <div class="row">
            <div class="col">
                <input type="text" id="update-player" class="form-control" value="${name}, ${skill}" required>
            </div>
            <div class="col col-auto">
                <button class="btn btn-sm btn-success text-white" onclick="updatePlayerByIndex(${index})">✔</button>
            </div>
        </div>
    `)
}

const selectRow = (index) => {
    $('#bulk-actions').removeClass('d-none');
    if (bulkSelection.includes(index)) {
        const indexToRemove = bulkSelection.indexOf(index);
        if (indexToRemove !== -1) {
            bulkSelection.splice(indexToRemove, 1);
            if (bulkSelection.length === 0) {
                resetBulk();
            }
        }
    } else {
        bulkSelection.push(index);
    }
}

const resetBulk = () => {
    bulkSelection = [];
    $('#bulk-actions').addClass('d-none');
    $('input[name="bulk[]"]').prop('checked', false);
    $("#select-bulk-action").prop("selectedIndex", 0);
}

const updatePlayers = () => {
    // Update grid
    playersGrid.updateConfig({
        data: getPlayersData(savedPlayers)
    }).forceRender();

    // Update players count
    $('#players_count').html(`${savedPlayers.length} joueur.euse.s`);

    setTimeout(() => {
        // Add actions
        $('#players_list tbody [data-column-id="actions"]').each((index, element) => {
            $(element).html(`
                <button class="btn btn-sm btn-primary text-white" onclick="editPlayerByIndex(${index})">✎</button>
                <button class="btn btn-sm btn-danger text-white" onclick="removePlayerByIndex(${index})">×</button>
            `)
        });


        // Reset bulk
        resetBulk();

        // Add bulk
        $('#players_list tbody [data-column-id="bulk"]').each((index, element) => {
            $(element).html(`
                <input type="checkbox" name="bulk[]" class="form-check-input" value="${index}" onChange="selectRow(${index})" />
            `);
        });

        $('td[data-column-id="gender"]').removeClass('gender-f gender-m gender-n');
        setTimeout(() => {
            $('td[data-column-id="gender"]').each((index, element) => {
                let genderClass = '';
                switch ($(element).text()) {
                    case '♂':
                        genderClass = 'gender-male';
                        break;
                    case '♀':
                        genderClass = 'gender-female';
                        break;
                    case '⚥':
                    default:
                        genderClass = 'gender-neutral';
                        break;
                }
                $(element).removeClass('gender-male gender-female gender-neutral').addClass(genderClass);
            })
        }, 100);

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

const generateHats = () => {
    for (let hat = 1; hat <= savedConfig.skill_range; hat++) {
        let hatPlayers = '';
        for (const player of savedPlayers.filter((player) => player.skill === hat)) {
            hatPlayers += `<tr><td>${player.name}</td></tr>`;
        }
        $('#hats-container').append(`
            <div class="col col-md-3">
                <table id="table-hat-${hat}" class="table table-bordered">
                    <thead class="table-secondary">
                        <tr>
                            <th>Chapeau #${hat}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hatPlayers}
                    </tbody>
                </table>
            </div>
        `);
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
    $('#btn-generate-teams').remove();
    $('#btn-export-teams, #teams-title').removeClass('d-none');
    savedTeams = getTeams([...savedPlayers], savedConfig.players_per_team);

    displayTeams();
}

const getPlayerIndexesByName = (playerNames) => {
    const indexes = [];
    for (const playerName of playerNames) {
        savedTeams.map((team, teamIndex) => {
            team.map((player, playerIndex) => {
                if (player.name === playerName) {
                    indexes.push([teamIndex, playerIndex]);
                }
            })
        })
    }
    return indexes
}

const addForTrade = (member, teamNumber, memberNumber) => {
    $(`#team-${teamNumber}-${memberNumber} td`).addClass('bg-secondary text-white');
    trade.push(member);

    if (trade.length === 2) {
        setTimeout(() => {
            // Change teams
            const playerTradeIndexes = getPlayerIndexesByName(trade)
            const playerToTrade = savedTeams[playerTradeIndexes[0][0]][playerTradeIndexes[0][1]];
            savedTeams[playerTradeIndexes[0][0]][playerTradeIndexes[0][1]] = savedTeams[playerTradeIndexes[1][0]][playerTradeIndexes[1][1]];
            savedTeams[playerTradeIndexes[1][0]][playerTradeIndexes[1][1]] = playerToTrade;
            // Update teams display
            displayTeams()
            // Clear trade
            trade = [];
        }, 200)
    }
}

const displayTeams = () => {
    // Reset team container
    $(`#teams`).html('');
    // Append teams
    for (const [number] of savedTeams.entries()) {
        $(`#teams`).append(`
            <div class="col col-12 col-md-6 col-xl-4">
                <table class="table table-bordered team-table" id="team-${number}">
                    <thead class="table-${getTableColor(number)}">
                        <tr>
                            <th colspan="4">
                                Équipe #${number + 1}
                            </th>
                        </tr>
                        <tbody></tbody>
                    </thead>
                </table>
            </div>
        `);
    }

    setTimeout(() => {
        for (const [teamNumber, team] of savedTeams.entries()) {
            let memberNumber = 0;
            for (const member of team) {
                $(`#team-${teamNumber} tbody`).append(`
                    <tr id="team-${teamNumber}-${memberNumber}">
                        <td class="gender-${member.gender}">${getPlayerGenderSymbol(member.gender)}</td>
                        <td>${member.name}</td>
                        <td>${member.skill}</td>
                        <td><button class="btn btn-sm btn-outline-secondary" onclick="addForTrade('${member.name}', ${teamNumber}, ${memberNumber});">⇆</button></td>
                    </tr>
                `);
                memberNumber++;
            }
        }
    });
}


$(document).ready(() => {
    setStep(1);

    $('#btn-generate-teams').on('click', () => {
        $('#teams .accordion-collapse').removeClass('show');
        generateTeams();
    });

    $('#btn-validate-players').on('click', () => {
        setStep(4);
    });

    $('#import').on('submit', (event) => {
        event.preventDefault();
        resetErrors();
        const values = getFormValues(['players']);
        importPlayers(values.players.split('\n'));
        setStep(3);
    });

    $('#setup').on('submit', (event) => {
        event.preventDefault();
        const values = getFormValues(['players_per_team', 'skill_range']);
        savedConfig.players_per_team = values.players_per_team;
        savedConfig.skill_range = values.skill_range;
        setStep(2);
    });

    $('#main-breadcrumb .breadcrumb-item').on('click', (event) => {
        setStep(parseInt($(event.currentTarget).attr('data-step')));
    });

    $('#btn-bulk-apply').on('click', () => {
        const action = $('#select-bulk-action').val();
        for (const index of bulkSelection.sort((a, b) => b - a)) {
            if (action === 'delete') {
                removePlayerByIndex(index);
            } else {
                savedPlayers[index] = {...savedPlayers[index], gender: action};
            }
        }

        setTimeout(() => {
            resetBulk();
            if (action !== 'delete') {
                updatePlayers();
            }
        }, 500)
    });

    $('#btn-export-teams').on('click', () => {
       setStep(5);
    });

    playersGrid = new gridjs.Grid({
        data: getPlayersData([]),
        columns: playerColumns,
    }).render(document.getElementById("players_list"));

    errorsGrid = new gridjs.Grid({
        data: [],
        columns: errorsColumns,
    }).render(document.getElementById("errors_list"));
});