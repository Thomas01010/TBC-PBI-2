import React from "react";
import {
  Container,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Input,
  Label,
  Alert,
  InputGroup,
} from "reactstrap";

import ReactJson from "react-json-view";

import {
  WorkspaceAPI,
  IRouteKey,
  ExtensionSubMenu,
  ConnectProject,
  ConnectUser,
  connect,
  EventId,
  WorkspaceEventData,
} from "trimble-connect-workspace-api";

import { API_TYPES } from "./constants";

const ENV_URL = process.env.REACT_APP_ENV_URL
  ? `.${process.env.REACT_APP_ENV_URL}.`
  : ".";
const menuIcon = `https://components${ENV_URL}connect.trimble.com/trimble-connect-project-workspace-api/logo192.png`;

interface IProps {
  APIType: string;
  setAPIType: (type: string) => void;
}

class ProjectExtension extends React.Component<IProps, any> {
  private API?: WorkspaceAPI;

  constructor(props: IProps) {
    super(props);
    this.state = {
      mainMenu: {
        title: "Test React app",
        icon: menuIcon,
        command: "main_nav_menu_cliked",
      },
      subMenuItems: [
        {
          title: "Extension API",
          icon: menuIcon,
          command: API_TYPES.extension,
        },
        {
          title: "Embed API",
          icon: menuIcon,
          command: API_TYPES.embed,
        },
      ],
      accessToken: "",
    };
  }

  async componentDidMount() {
    const { mainMenu, subMenuItems = [] } = this.state;
    // This API instance is for the extension usecase
    this.API = await connect(
      window.parent,
      (event: EventId, args: WorkspaceEventData<EventId>) => {
        if (!args?.data) {
          return;
        }
        switch (event) {
          // @ts-ignore will be removed after adding this event to the UWA events
          case "extension.command":
            if (
              typeof args?.data === "string" &&
              Object.values(API_TYPES).includes(args.data)
            ) {
              this.props.setAPIType(args.data);
            }
            this.setState({
              alertMessage: `Command executed by the user {command:${args.data}}`,
            });
            break;
          case "extension.accessToken":
            this.setState({ accessToken: args.data });
            break;
          // @ts-ignore will be removed after adding this event to the UWA events
          case "extension.userSettingsChanged":
            this.setState({ alertMessage: `User settings changed!` });
            this.getUserSettings();
            break;
          default:
        }
      },
      30000
    );
    this.API?.ui?.setMenu({ ...mainMenu, subMenus: [...subMenuItems] }).then();
  }

  addSubMenu = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    this.onCancel();
    this.setState({
      modal: true,
      formData: { title: "", icon: "", command: "" },
    });
  };

  onCancel = () => {
    this.setState({
      modal: false,
      editMenu: undefined,
      formData: undefined,
      editIndex: undefined,
    });
  };

  editMainMenu = () => {
    const formData = { ...this.state.mainMenu };
    this.setState({ modal: true, editMenu: "mainMenu", formData });
  };

  setActiveCommand = (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    command: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ activeCommand: command });
  };

  updateStatus = () => {
    const { statusMessage = "" } = this.state;
    if (this.API) {
      this.API.extension.setStatusMessage(statusMessage);
    }
  };

  getProjectDetails = () => {
    if (this.API) {
      this.API.project
        .getProject()
        .then((projectInfo: ConnectProject) => this.setState({ projectInfo }));
    }
  };

  getUserSettings = () => {
    if (this.API) {
      this.API.user
        .getUser()
        .then((userSettings: ConnectUser) => this.setState({ userSettings }));
    }
  };

  getAccessToken = () => {
    if (this.API) {
      this.API.extension
        .getPermission("accesstoken")
        .then((accessToken: string) => this.setState({ accessToken }));
    }
  };

  goTo = (routeKey = "settings-extensions") => {
    if (this.API) {
      this.API.extension.goTo(routeKey as IRouteKey);
    }
  };

  toggle = () => this.setState({ modal: !this.state.modal });

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      formData: { ...this.state.formData, [e.target.name]: e.target.value },
    });
  };

  onSave = () => {
    const { formData, editMenu, editIndex = 0, subMenuItems = [] } = this.state;
    if (!formData) return;
    if (editMenu === "mainMenu") {
      this.setState({ mainMenu: { ...formData } });
    } else if (editMenu === "subMenuItems") {
      if (subMenuItems.length === 0) return;
      const newSubMenuItems: ExtensionSubMenu[] = subMenuItems.map(
        (sm: ExtensionSubMenu, i: number) =>
          i === editIndex ? { ...formData } : sm
      );
      this.setState({ subMenuItems: [...newSubMenuItems] });
    } else {
      this.setState({ subMenuItems: [...subMenuItems, { ...formData }] });
      this.onCancel();
    }
  };

  editSubmenu = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    i: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const formData = { ...this.state.subMenuItems[i] };
    this.setState({
      modal: true,
      editMenu: "subMenuItems",
      editIndex: i,
      formData,
    });
  };

  removeSubmenu = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const newSubmentItems = [...this.state.subMenuItems];
    newSubmentItems.splice(index, 1);
    this.setState({ subMenuItems: [...newSubmentItems] });
  };

  public render() {
    const {
      mainMenu,
      subMenuItems = [],
      activeCommand,
      modal = false,
      formData = {},
      alertMessage,
      statusMessage = "",
      projectInfo = {},
      userSettings = {},
      accessToken = "",
    } = this.state;

    console.log(ENV_URL);

    return (
      <Container>
        {/** extension.setMenu, extension.setActiveMenuItem*/}
        <Row className="section">
          {alertMessage && (
            <Col md="12">
              <Alert
                color="success"
                isOpen={!!alertMessage}
                toggle={() => this.setState({ alertMessage: undefined })}
                fade={false}
              >
                {alertMessage}
              </Alert>
            </Col>
          )}
          <Col md="12">
            <h3>
              Example: <i>ui.setMenu</i> & <i>ui.setActiveMenuItem</i>
            </h3>
            <p>
              Dynamically manage the submenu items. (<strong>Menu Title</strong>
              :<i>command</i>){" "}
              <Button
                color="primary"
                size="sm"
                style={{ marginLeft: "2rem" }}
                onClick={this.addSubMenu}
              >
                Add sub-menu
              </Button>
            </p>
          </Col>
          <Col md="12">
            <ListGroup>
              <ListGroupItem tag="div" className="menu-item">
                <div>
                  {mainMenu.icon && (
                    <img src={mainMenu.icon} className="sml-img" alt="" />
                  )}
                  <strong>{mainMenu.title}</strong>:<i>{mainMenu.command}</i>
                  <Button
                    color="info"
                    size="sm"
                    style={{ marginLeft: "2rem" }}
                    onClick={this.editMainMenu}
                  >
                    Edit
                  </Button>
                </div>
                <div>Main-menu</div>
              </ListGroupItem>
              {subMenuItems.map((sm: any, i: number) => (
                <ListGroupItem
                  key={sm.command}
                  tag="a"
                  href="#"
                  className="menu-item submenu"
                  active={activeCommand && activeCommand === sm.command}
                  onClick={(e) =>
                    this.setActiveCommand(
                      e,
                      sm.command + "?payload=testdatanew"
                    )
                  }
                >
                  <div>
                    {sm.icon && (
                      <img src={sm.icon} className="sml-img" alt="" />
                    )}
                    <strong>{sm.title}</strong>:<i>{sm.command}</i>{" "}
                    <Button
                      color="info"
                      size="sm"
                      style={{ marginLeft: "2rem" }}
                      onClick={(e) => this.editSubmenu(e, i)}
                    >
                      Edit
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      style={{ marginLeft: "2rem" }}
                      onClick={(e) => this.removeSubmenu(e, i)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div>Sub-menu</div>
                </ListGroupItem>
              ))}
            </ListGroup>
          </Col>
        </Row>

        {/** extension.setStatusMessage*/}
        <Row className="section">
          <Col md="12">
            <h3>
              Example: <i>extension.setStatusMessage</i>
            </h3>
            <p>Dynamically update the extension status message.</p>
          </Col>
          <Col md="12">
            <InputGroup>
              <Input
                onChange={(e) =>
                  this.setState({ statusMessage: e.target.value })
                }
                defaultValue={statusMessage}
              />

              <Button color="primary" onClick={this.updateStatus}>
                Update
              </Button>
            </InputGroup>
          </Col>
        </Row>

        {/** extension.getCurrentProject*/}
        <Row className="section">
          <Col md="12">
            <h3>
              Example: <i>project.getCurrentProject</i>
            </h3>
            <p>
              Get the current project details.{" "}
              <Button
                color="primary"
                size="sm"
                style={{ marginLeft: "2rem" }}
                onClick={this.getProjectDetails}
              >
                Get Project
              </Button>
            </p>
          </Col>
          <Col md="12">
            <ReactJson src={projectInfo} />
          </Col>
        </Row>

        {/** extension.getUserSettings*/}
        <Row className="section">
          <Col md="12">
            <h3>
              Example: <i>user.getUserSettings</i>
            </h3>
            <p>
              Get the current user settings details.{" "}
              <Button
                color="primary"
                size="sm"
                style={{ marginLeft: "2rem" }}
                onClick={this.getUserSettings}
              >
                Get User Settings
              </Button>
            </p>
          </Col>
          <Col md="12">
            <Form>
              {Object.keys(userSettings).map((field) => {
                const value = userSettings[field];
                return (
                  <FormGroup row key={field} style={{ marginBottom: "1rem" }}>
                    <Label for={field} sm={2} className="capz">
                      {field}
                    </Label>
                    <Col sm={10}>
                      <Input
                        type="text"
                        name={field}
                        id={field}
                        defaultValue={value}
                        readOnly
                      />
                    </Col>
                  </FormGroup>
                );
              })}
            </Form>
          </Col>
        </Row>

        {/** extension.getPermission*/}
        <Row className="section">
          <Col md="12">
            <h3>
              Example: <i>extension.getPermission</i>
            </h3>
            <p>
              Request the accessToken.{" "}
              <Button
                color="primary"
                size="sm"
                style={{ marginLeft: "2rem" }}
                onClick={this.getAccessToken}
              >
                Get accessToken
              </Button>
            </p>
          </Col>
          <Col md="12">
            <Form>
              <FormGroup row style={{ marginBottom: "1rem" }}>
                <Label for={"accessToken"} sm={2} className="capz">
                  {"AccessToken"}
                </Label>
                <Col sm={10}>
                  <Input
                    type="text"
                    name={"accessToken"}
                    id={"accessToken"}
                    defaultValue={accessToken}
                    readOnly
                  />
                </Col>
              </FormGroup>
            </Form>
          </Col>
        </Row>

        {/** extension.goTo*/}
        <Row className="section">
          <Col md="12">
            <h3>
              Example: <i>extension.goTo</i>
            </h3>
            <p>
              Go to a specific route/page.{" "}
              <Button
                color="primary"
                size="sm"
                style={{ marginLeft: "2rem" }}
                onClick={() => this.goTo()}
              >
                Click here
              </Button>
            </p>
            <p>
              Go to the project settings page.{" "}
              <Button
                color="primary"
                size="sm"
                style={{ marginLeft: "2rem" }}
                onClick={() => this.goTo("settings-details")}
              >
                Click here
              </Button>
            </p>
          </Col>
        </Row>

        <Modal isOpen={modal} toggle={this.toggle}>
          <div className="modal-header">
            <h5 className="modal-title">Modal title</h5>
          </div>
          <ModalBody>
            <Form>
              {Object.keys(formData).map((field) => {
                const value = formData[field];
                return (
                  <FormGroup row key={field} style={{ marginBottom: "1rem" }}>
                    <Label for={field} sm={2} className="capz">
                      {field}
                    </Label>
                    <Col sm={10}>
                      <Input
                        type="text"
                        name={field}
                        id={field}
                        placeholder={`Enter ${field}`}
                        defaultValue={value}
                        onChange={this.onChange}
                      />
                    </Col>
                  </FormGroup>
                );
              })}
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.onSave}>
              Submit
            </Button>{" "}
            <Button color="secondary" onClick={this.onCancel}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    );
  }
}

export default ProjectExtension;
