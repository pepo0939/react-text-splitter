import React, { Component, Fragment } from "react";

const divitionsType = {
  SENTENCES: "SENTENCES",
  WORDS: "WORDS",
  CHARACTERS: "CHARACTERS",
  BY_CHARACTER: "BY CHARACTER",
};

const styles = {
  container: {},
  paragraph: {},
  sentence: {
    position: "relative",
    display: "inline-block",
  },
  word: {
    position: "relative",
    display: "inline-block",
  },
  character: {
    position: "relative",
    display: "inline-block",
  },
};

const StyleContext = React.createContext();
const RefContext = React.createContext({
  sentenceRefs: () => {},
  wordRefs: () => {},
  charRefs: () => {},
});

const Character = ({ children: char, id }) => (
  <RefContext.Consumer>
    {({ charRefs }) => (
      <StyleContext.Consumer>
        {({ character: charStyle }) => (
          <div ref={charRefs} style={charStyle} id={id}>
            {char}
          </div>
        )}
      </StyleContext.Consumer>
    )}
  </RefContext.Consumer>
);
const renderCharacters = (splitIn, text, id = "") =>
  text.split("").map((char, index) => (
    <Character key={`${id}c${index}`} id={`${id}c${index}`}>
      {char}
    </Character>
  ));

const Word = ({ children: word, id, splitIn }) => (
  <RefContext.Consumer>
    {({ wordRefs }) => (
      <StyleContext.Consumer>
        {({ word: wordsStyle = {} }) => (
          <Fragment>
            <div ref={wordRefs} style={wordsStyle} id={id}>
              {renderedDivition(
                splitIn.filter(div => div !== divitionsType.WORDS),
                word,
                id
              )}
            </div>{" "}
          </Fragment>
        )}
      </StyleContext.Consumer>
    )}
  </RefContext.Consumer>
);

const renderWords = (splitIn, text, id = "") =>
  text
    .split(" ")
    .filter(word => word !== "")
    .map((word, index) => (
      <Word key={`${id}w${index}`} id={`${id}w${index}`} splitIn={splitIn}>
        {word}
      </Word>
    ));

const Sentence = ({ children: sentence, id, splitIn }) => (
  <RefContext.Consumer>
    {({ sentenceRefs }) => (
      <StyleContext.Consumer>
        {({ sentence: sentStyle }) => (
          <Fragment>
            <div ref={sentenceRefs} style={sentStyle} id={id}>
              {renderedDivition(
                splitIn.filter(div => div !== divitionsType.SENTENCES),
                sentence,
                id
              )}
            </div>{" "}
          </Fragment>
        )}
      </StyleContext.Consumer>
    )}
  </RefContext.Consumer>
);

const renderSentences = (splitIn, sentences) =>
  sentences.split(". ").map((sentence, index) => (
    <Sentence key={index} id={`s${index}`} splitIn={splitIn}>
      {`${sentence}.`}
    </Sentence>
  ));

/*const renderSentences = (splitIn, sentences) =>
  sentences.map((sentence, index) => (
    <Sentence key={index} id={`s${index}`} splitIn={splitIn}>
      {sentence}
    </Sentence>
  ));
  */

const renderedDivition = (splitIn, children, id) => {
  const arrayStringChildren = React.Children.map(children, child => {
    return !child.type ? child : child.props.children;
  });

  const textChildren = arrayStringChildren.reduce(
    (acc, text) => (acc === "" ? text : `${acc} ${text}`),
    ""
  );

  if (splitIn.some(divition => divition === divitionsType.SENTENCES))
    return renderSentences(splitIn, textChildren);

  if (splitIn.some(divition => divition === divitionsType.WORDS))
    return renderWords(splitIn, textChildren, id);

  if (splitIn.some(divition => divition === divitionsType.CHARACTERS))
    return renderCharacters(splitIn, textChildren, id);

  return children;
};

export default class Splitter extends Component {
  constructor(props) {
    super(props);

    this.sentences = [];
    this.words = [];
    this.characters = [];
  }

  sentenceRefs = sRef => sRef && this.sentences.push(sRef);
  wordRefs = wRef => wRef && this.words.push(wRef);
  charRefs = cRef => cRef && this.characters.push(cRef);

  componentDidMount() {
    this.updateRefs();
  }

  componentDidUpdate = prevProps => {
    if (this.props.rejoin) {
      this.sentences = [];
      this.words = [];
      this.characters = [];
    }
    if (prevProps.rejoin !== this.props.rejoin) this.updateRefs();
  };

  updateRefs = () => {
    const {
      getSentences = () => {},
      getWords = () => {},
      getCharacters = () => {},
      getDivisionRefs = () => {},
      rejoin = false,
    } = this.props;
    const sentences = rejoin ? [] : this.sentences;
    const words = rejoin ? [] : this.words;
    const characters = rejoin ? [] : this.characters;
    getSentences(sentences);
    getWords(words);
    getCharacters(characters);
    getDivisionRefs({
      sentences,
      words,
      characters,
    });
  };

  render() {
    let {
      styles: customeStyles = {},
      splitIn = [divitionsType.SENTENCES],
      children,
    } = this.props;
    customeStyles = Object.keys(styles).reduce(
      (obj, key) => ({
        ...obj,
        [key]: { ...styles[key], ...customeStyles[key] },
      }),
      {}
    );
    splitIn = splitIn.map(div => div.toUpperCase());

    if (!children) return null;

    if (this.props.rejoin)
      return <div style={customeStyles.container}>{this.props.children}</div>;

    return (
      <RefContext.Provider
        value={{
          sentenceRefs: this.sentenceRefs,
          wordRefs: this.wordRefs,
          charRefs: this.charRefs,
        }}
      >
        <StyleContext.Provider value={customeStyles}>
          {renderedDivition(splitIn, children)}
        </StyleContext.Provider>
      </RefContext.Provider>
    );
  }
}
