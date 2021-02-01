import React from "react";
import { List } from 'semantic-ui-react';
import useLongPress from "./useLongPress";

const ListItemContent = (props) => {
    const longPressEvent = useLongPress(props.longPressCallback, props.onClick, {
        shouldPreventDefault: true,
        delay: 800,
    });
    return <List.Content className="list-content" {...longPressEvent}>  
        <List.Header dangerouslySetInnerHTML={{__html: props.itemName}} />
        {/* <List.Description>{this.state.stuff[key].cat}</List.Description> */}
    </List.Content>;
};

export default ListItemContent;
