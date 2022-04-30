let MemoryGameController = function ($scope, $timeout) {

    let constants = new (function () {
        let rows = 2;
        let columns = 2;
        let numMatches = (rows * columns) / 2;
        this.getRows = function () { return rows; };
        this.getColumns = function () { return columns; };
        this.getNumMatches = function () { return numMatches; };
    })();


    let currentSessionOpen = false;
    let previousCard = null;
    let numPairs = 0;

    $scope.removeByIndex = function (arr, index) {
        arr.splice(index, 1);
    }

    $scope.insertByIndex = function (arr, index, item) {
        arr.splice(index, 0, item);
    }

    $scope.createRandom = function () {
        let matches = constants.getNumMatches();
        let pool = [];
        let answers = [];
        let icons = [
            'ad',
            'address-book',
            'address-card',
            'adjust',
            'air-freshener',
            'align-center',
            'align-justify',
            'align-left',
            'align-right',
            'allergies',
            'ambulance',
            'american-sign-language-interpreting',
            'anchor',
            'angle-double-down',
            'angle-double-left',
            'angle-double-right',
            'angle-double-up',
            'angle-down',
            'angle-left',
            'angle-right',
            'angle-up',
            'angry',
            'ankh',
            'apple-alt',
            'archive',
            'archway',
        ];

        let items = icons;

        for (let i = 0; i < matches * 2; i++) {
            pool.push(i);
        }

        for (let n = 0; n < matches; n++) {
            let randLetter = Math.floor((Math.random() * items.length));
            let letter = items[randLetter];
            $scope.removeByIndex(items, randLetter);

            let randPool = Math.floor((Math.random() * pool.length));

            $scope.insertByIndex(answers, pool[randPool], letter);

            $scope.removeByIndex(pool, randPool);

            randPool = Math.floor((Math.random() * pool.length));
            $scope.insertByIndex(answers, pool[randPool], letter);

            $scope.removeByIndex(pool, randPool);
        }
        return answers;
    }

    $scope.createDeck = function () {
        let rows = constants.getRows();
        let cols = constants.getColumns();
        let key = $scope.createRandom();
        let deck = {};
        deck.rows = [];

        for (let i = 0; i < rows; i++) {
            let row = {};
            row.cards = [];
            for (let j = 0; j < cols; j++) {
                let card = {};
                card.isFaceUp = false;
                card.item = key.pop();
                row.cards.push(card);
            }
            deck.rows.push(row);
        }
        return deck;
    }

    let timer = null;
    $scope.init = function () {
        $scope.deck = $scope.createDeck();
        $scope.isGuarding = true;
        $scope.inGame = false;
        $scope.matchedCards = [];
        $scope.moves = 0;
        $scope.progress = 0;
    }

    $scope.init();

    $scope.check = function (card) {

        if (!card.isFaceUp) {
            $scope.moves++;
        }

        if (currentSessionOpen && previousCard != card && previousCard.item == card.item && !card.isFaceUp) {
            card.isFaceUp = true;
            card.moveCard = previousCard.moveCard = true;

            $scope.matchedCards.push(card)
            previousCard = null;
            currentSessionOpen = false;

            numPairs++;

        } else if (currentSessionOpen && previousCard != card && previousCard.item != card.item && !card.isFaceUp) {
            $scope.isGuarding = true;
            card.isFaceUp = true;
            currentSessionOpen = false;
            $timeout(function () {
                previousCard.isFaceUp = card.isFaceUp = false;
                previousCard = null;
                $scope.isGuarding = $scope.timeLimit ? false : true;
            }, 1000);
        } else {
            card.isFaceUp = true;
            currentSessionOpen = true;
            previousCard = card;
        }


        $scope.progress = this.getProgress();

        if (numPairs == constants.getNumMatches()) {

            $scope.progress = 100;

            swal("Congratulations!", "You won the game!", "success").then((val) => {
                $scope.init();
                $scope.stopTimer();
                $scope.$apply()
            });
        }
    }

    $scope.getProgress = function () {

        return (numPairs / constants.getNumMatches()) * 100
    }


    $scope.timeLimit = 0;
    $scope.isCritical = false;


    $scope.start = function () {
        $scope.deck = $scope.createDeck();
        $scope.moves = 0;
        $scope.startInitTimer();
    }


    $scope.flipCardsOnce = function (bool) {
        angular.forEach($scope.deck.rows, function (row, key) {
            angular.forEach(row.cards, function (value, key) {
                value.isFaceUp = bool
            });
        });
    }

    $scope.startInitTimer = function () {

        $scope.timeLimit = 5000;
        $scope.isGuarding = false;
        $scope.inGame = true;
        $scope.matchedCards = [];
        $scope.initTimerRunning = true;

        $scope.flipCardsOnce(true);

        ($scope.startTimer = function () {
            $scope.timeLimit -= 1000;
            $scope.isCritical = $scope.timeLimit <= 10000 ? true : false;

            timer = $timeout($scope.startTimer, 1000);
            if ($scope.timeLimit === 0) {
                $scope.stopTimer();
                $scope.isGuarding = true;
                $scope.initTimerRunning = false;
                $scope.flipCardsOnce(false);

            }
            if (!$scope.initTimerRunning) {
                $scope.startMainTimer();
            }

        })();
    }
    $scope.startMainTimer = function () {

        $scope.timeLimit = 60000;
        $scope.isGuarding = false;
        $scope.inGame = true;
        $scope.matchedCards = [];

        ($scope.startTimer = function () {
            $scope.timeLimit -= 1000;
            $scope.isCritical = $scope.timeLimit <= 10000 ? true : false;

            timer = $timeout($scope.startTimer, 1000);
            if ($scope.timeLimit === 0) {
                $scope.stopTimer();
                $scope.isGuarding = true;
            }
        })();
    }

    $scope.resetPressed = false;

    $scope.stopTimer = function () {

        $timeout.cancel(timer);

        if (!$scope.resetPressed && $scope.initTimerRunning == false && numPairs < constants.getNumMatches()) {

            swal({
                title: "Failed!",
                text: "Better luck next time!",
                icon: "warning",
                dangerMode: true,
            }).then((val) => {
                $scope.init();
                $scope.$apply()
            });
        }

        $scope.inGame = false;
        previousCard = null;
        currentSessionOpen = false;
        numPairs = 0;
        $scope.timeLimit = 0;
        $scope.resetPressed = false;
    }

    $scope.reset = function () {
        $scope.resetPressed = true;
        $scope.init();
        $scope.stopTimer();
    }
}

