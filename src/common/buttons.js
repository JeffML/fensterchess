import '../stylesheets/buttons.css'

const BaseButton = ({bgcolor, text, onClick, style, disabled}) => 
    <button className="button-3" 
        style={{backgroundColor:bgcolor, ...style}} onClick={onClick} disabled={disabled}>
            {text}
        </button>

const ExitButton = ({text='Return', onClick, style}) => BaseButton({bgcolor:'red', text, onClick, style})

const ActionButton = (props) => BaseButton({bgcolor:'seagreen', ...props})

export {BaseButton as default, ExitButton, ActionButton}