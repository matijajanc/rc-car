export const sectionListData = [
  {
    title: 'Analog Pins',
    data: [
      {
        pin: 0,
        text: 'Engine temperature',
        type: 'INPUT \"LM35\"'
      },
      {
        pin: 1,
        text: 'Battery voltage',
        type: 'INPUT'
      },
      {
        pin: 2,
        text: 'Distance sensor front \"Echo\"',
        type: 'INPUT',
        color: 'gray'
      },
      {
        pin: 3,
        text: 'Distance sensor front \"Trig\"',
        type: 'OUTPUT',
        color: 'purple'
      },
      {
        pin: 4,
        text: 'Distance sensor rear \"Echo\"',
        type: 'INPUT'
      },
      {
        pin: 5,
        text: 'Distance sensor rear \"Trig\"',
        type: 'OUTPUT'
      }
    ]
  },
  {
    title: 'Digital Pins',
    data: [
      {
        pin: 2,
        text: 'Speed',
        type: 'INPUT',
        color: 'purple'
      },
      {
        pin: 3,
        text: 'Rotation of the engine',
        type: 'INPUT',
        color: 'blue'
      },
      {
        pin: 4,
        text: 'High beams',
        type: 'OUTPUT',
        color: 'orange'
      },
      {
        pin: 5,
        text: 'Underbody lighting RED',
        type: 'OUTPUT',
        color: 'green'
      },
      {
        pin: 6,
        text: 'Underbody lighting BLUE',
        type: 'OUTPUT',
        color: 'yellow'
      },
      {
        pin: 7,
        text: 'Blinkers Left',
        type: 'OUTPUT',
        color: 'yellow'
      },
      {
        pin: 8,
        text: 'Blinkers Right',
        type: 'OUTPUT',
        color: 'blue'
      },
      {
        pin: 9,
        text: 'Left/Right',
        type: 'OUTPUT',
        color: 'blue'
      },
      {
        pin: 10,
        text: 'Servo for front distance sensor',
        type: 'OUTPUT',
        color: 'yellow'
      },
      {
        pin: 11,
        text: 'Forward / Backward',
        type: 'OUTPUT',
        color: 'white'
      },
      {
        pin: 12,
        text: 'Lights',
        type: 'OUTPUT',
        color: 'green'
      },
      {
        pin: 13,
        text: 'Stop lights',
        type: 'OUTPUT',
        color: 'purple'
      },
    ]
  }
];