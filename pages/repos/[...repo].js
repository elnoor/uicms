import Page from "@/components/layout/page";
import {
  UICMS_CONFIGS,
  UICMS_CONFIG_STARTER_TEMPLATE,
} from "@/helpers/constants";
import { displayError, generateRandomString } from "@/helpers/utilities";
import useGitHubApi from "@/hooks/useGitHubApi";
import useStateManagement from "@/services/stateManagement/stateManagement";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaGithub, FaGlobe, FaRegSun, FaRegListAlt } from "react-icons/fa";
import { FcPlus, FcSettings } from "react-icons/fc";
import { TextInput } from "@/components/form";
import TitleWithTabs from "@/components/titleWithTabs";
import Link from "next/link";

export default function Repo() {
  const router = useRouter();
  const [repoOwner, repoName] = router.query.repo || [];
  const [loading, setLoading] = useState(true);
  const githubApi = useGitHubApi();
  const { state, dispatchAction } = useStateManagement();
  const [repo, setRepo] = useState(null);
  const sha = repo?.configFile.sha;
  const config = repo?.configFile.data;

  const getConfig = useCallback(async () => {
    try {
      const res = await githubApi.customRest.getFileContentAndSha(
        repoOwner,
        repoName,
        UICMS_CONFIGS.fileName
      );
      const _repo = {
        ...repo,
        configFile: { sha: res.sha, data: JSON.parse(res.content) },
      };
      dispatchAction.updateRepo(_repo);
    } catch (e) {
      // when 404, no config file, incompatible repo
      if (e.status !== 404) {
        displayError("Error fetching config file!", e);
      }
    } finally {
      setLoading(false);
    }
  }, [dispatchAction, githubApi.customRest, repoOwner, repo, repoName]);

  // Initial fetch repo from state management
  useEffect(() => {
    let _repo = null;
    if (state.repos.length > 0 && repoOwner && repoName) {
      _repo = state.repos.find(
        (r) => r.owner === repoOwner && r.name === repoName
      );
      if (_repo) {
        setRepo(_repo);
        if (_repo.configFile.data) {
          setLoading(false);
        }
      }
    }

    // If landed directly to this page and repos have not been loaded to state management yet, redirect to repos page
    if (!_repo) {
      router.push("/repos");
    }
  }, [repoName, repoOwner, router, state.repos]);

  // If repo doesn't have config file data yet, fetch it
  useEffect(() => {
    if (repo && !repo.configFile.data && loading) {
      getConfig();
    }
  }, [getConfig, loading, repo]);

  const saveConfig = useCallback(
    async (_config) => {
      try {
        setLoading(true);
        await githubApi.rest.repos.createOrUpdateFileContents({
          owner: repoOwner,
          repo: repoName,
          path: UICMS_CONFIGS.fileName,
          message: `uicms config file ${sha ? "updated" : "created"}`,
          content: window.btoa(JSON.stringify(_config)), // base64 encode
          sha: sha,
        });
        await getConfig(); // re-fetch config as sha has been changed
      } catch (e) {
        displayError("Error saving config file!", e);
        setLoading(false);
      }
    },
    [getConfig, githubApi.rest.repos, repoOwner, repoName, sha]
  );

  return (
    <Page loading={loading} title={repoName || "Repo"}>
      <TitleWithTabs
        title={config?.websiteName}
        subtitle={`${repoOwner}/${repoName}`}
        tabs={[
          {
            text: "Collections",
            content: (
              <Collections
                config={config}
                repoOwner={repoOwner}
                repoName={repoName}
                saveConfig={saveConfig}
              />
            ),
            icon: <FaRegListAlt />,
            skip: !config || !sha,
          },
          {
            text: "Configuration",
            content: (
              <RepoConfiguration config={config} saveConfig={saveConfig} />
            ),
            icon: <FaRegSun />,
            skip: !config,
          },
          {
            text: "Website",
            href: config?.websiteUrl,
            icon: <FaGlobe />,
            skip: !config?.websiteUrl,
          },
          {
            text: "GitHub",
            href: `https://github.com/${repoOwner}/${repoName}`,
            icon: <FaGithub />,
          },
        ]}
      />

      {!config && (
        <NotFound
          setConfig={(conf) => setRepo({ ...repo, configFile: { data: conf } })}
        />
      )}

      {repo?.pushed_at && (
        <p className="has-text-grey">
          Repo last updated: {new Date(repo.pushed_at).toLocaleString()}
        </p>
      )}
    </Page>
  );
}

function NotFound({ setConfig }) {
  function initConfig() {
    setConfig({ ...UICMS_CONFIG_STARTER_TEMPLATE });
  }

  return (
    <article className="message is-warning mt-3">
      <div className="message-header">
        <p>Incompatible repo</p>
      </div>
      <div className="message-body">
        This repo is missing <code>{UICMS_CONFIGS.fileName}</code> file in the
        root directory. That means this repo hasn&apos;t been configured to work
        with UICMS.
        <div className="block mt-5">
          <p className="">
            Would you like to set UICMS up in this repo ?
            <button
              onClick={initConfig}
              className="button is-primary is-small ml-2"
            >
              Let&apos;s do it
            </button>
          </p>
        </div>
      </div>
    </article>
  );
}

function Collections({ config, repoOwner, repoName, saveConfig }) {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const sampleFiles = [
    "2302121450_How_to_edit_some_file_in_23.md",
    "2309231150_Lorem_impsu_stuff_goes_here.md",
    "2101232350_Nice_and_cool_stuffs_happen.md",
    "2011211415_Wherever_you_go_never_do_this.md",
    "2208201950_Slug_is_a_title_that_is.md",
    "2311221035_Underscore_sepearted_basically.md",
    "2212222042_A/n othe+r_tit&le.md",
    "2105212200_Wont_hurt.md",
  ];

  return (
    <section className="columns mt-3">
      <aside className="column is-one-fifth">
        <div className="is-flex is-align-items-center mb-2">
          <p className="uc-w-100 title is-5 m-0">Collections</p>
          <button className="button is-primary is-light">
            <span className="icon mr-1">
              <FcPlus />
            </span>
            New collection
          </button>
        </div>

        <div className="uc-parts uc-mx-n2-sm">
          {config.collections.map((c) => (
            <a
              key={c.id}
              className={`uc-part ${
                c.id === selectedCollection?.id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedCollection(c);
                setShowSettings(false);
              }}
            >
              {c.name}
            </a>
          ))}
        </div>
      </aside>

      {!selectedCollection ? (
        <p className="mx-auto my-auto">
          {config.collections.length > 0
            ? "Select a collection to view its items."
            : "Create a collection to get started."}
        </p>
      ) : (
        <div className="column">
          {showSettings ? (
            <CollectionSettings
              config={config}
              collectionId={selectedCollection.id}
              saveConfig={saveConfig}
            />
          ) : (
            <>
              <div className="is-flex is-align-items-center mb-2">
                <p className="uc-w-100 title is-5 m-0">
                  {selectedCollection.name}
                </p>
                <button className="button is-primary is-light mr-2">
                  <span className="icon mr-1">
                    <FcPlus />
                  </span>
                  New item
                </button>
                <button
                  className="button is-light"
                  onClick={() => setShowSettings(true)}
                >
                  <span className="icon mr-1">
                    <FcSettings />
                  </span>
                  Settings
                </button>
              </div>
              <div className="uc-parts uc-mx-n2-sm">
                {sampleFiles
                  .sort()
                  .reverse()
                  .map((file, index) => {
                    const name = file
                      .substring(10, file.length - 3)
                      .replaceAll("_", " ");
                    return (
                      <Link
                        key={index}
                        className="uc-part is-flex"
                        href={`/item/${repoOwner}/${repoName}/${
                          selectedCollection.id
                        }/${encodeURIComponent(file)}`}
                      >
                        <div className="uc-text-overflow">
                          <h1 className="is-size-5 uc-text-overflow">{name}</h1>
                          <small className="has-text-grey">
                            {`${file.substring(4, 6)}/${file.substring(
                              2,
                              4
                            )}/${file.substring(0, 2)} ${file.substring(
                              6,
                              8
                            )}:${file.substring(8, 10)}`}
                          </small>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function CollectionSettings({ config, collectionId, saveConfig }) {
  const unChagedCollection = useRef(null); // for hasChanges comparison
  const [collection, setCollection] = useState(null); // local version

  function save() {
    if (confirm("Are you sure ? ")) {
      const _config = { ...config };
      _config.collections = _config.collections.map((col) =>
        col.id === collectionId ? collection : col
      );
      debugger;
      // if(!collectionId){
      // const id = generateId(collection.name);
      // }
      saveConfig(_config);
    }
  }

  useEffect(() => {
    const _collection = config.collections.find((c) => c.id === collectionId);
    setCollection(_collection);
    unChagedCollection.current = _collection;
  }, [collectionId, config.collections]);

  function onChange(e) {
    const { name, value } = e;

    const _collection = { ...collection };
    if (name === "itemName") {
      _collection.item = { ..._collection.item, name: value };
    } else {
      _collection[name] = value;
    }

    setCollection(_collection);
  }

  function generateId(str) {
    let id = str.toLowerCase().replace(/[^a-z]/g, ""); // only lower case english letters allowed
    if (id.length <= 8) {
      // has to be of size 8
      id = id + generateRandomString(8 - id.length); // if less add new random chars
    }
    if (config.collections.includes((c) => c.id === id)) {
      // if already use within collection ids
      id = id.substring(0, 4); // has to generate last 3 chars randomly again
      generateId(id);
    }
    return id;
  }

  function hasChanges() {
    return (
      JSON.stringify(collection) !== JSON.stringify(unChagedCollection.current)
    );
  }

  return (
    <fieldset className="uc-parts">
      <InputWithHelp
        name="name"
        value={collection?.name}
        onChange={onChange}
        label="Collection"
        help="Name of the collection. Usually in plural."
        placeholder="E.g: Blogposts, FAQs, Services, Skills, Slides"
        required={true}
      />
      <InputWithHelp
        name="directory"
        value={collection?.directory}
        onChange={onChange}
        label="Directory"
        help="The directory where items of this collection will be stored"
        placeholder="_contents/collections/blogposts"
        required={true}
      />
      <InputWithHelp
        name="itemName"
        value={collection?.item.name}
        onChange={onChange}
        label="Item name"
        help="The name of items that belong to this collection."
        placeholder="Blogpost"
        required={true}
      />
      <div className="uc-part is-clearfix">
        <button
          onClick={save}
          disabled={!hasChanges()}
          className="button is-primary is-light is-pulled-right"
        >
          Save changes
        </button>
      </div>
    </fieldset>
  );
}

function RepoConfiguration({ config, saveConfig }) {
  const [conf, setConf] = useState({ ...config }); // local version

  function onChange(e) {
    const { name, value } = e;
    const _conf = { ...conf, [name]: value };
    setConf(_conf);
  }

  function save() {
    if (confirm("Are you sure ? ")) {
      saveConfig(conf);
    }
  }

  function hasChanges() {
    return JSON.stringify(conf) !== JSON.stringify(config);
  }

  return (
    <section className="uc-mx-n2-sm pt-5">
      <fieldset className="uc-parts mx-auto uc-w-50 uc-w-100-sm">
        <InputWithHelp
          name="websiteName"
          value={conf?.websiteName}
          onChange={onChange}
          label="Website name"
          help="Just a name to identify for yourself."
          placeholder="Bob's personal blog"
          required={true}
        />
        <InputWithHelp
          name="websiteUrl"
          value={conf?.websiteUrl}
          onChange={onChange}
          label="Website URL"
          placeholder="https://mycoolblog.com"
        />
        <InputWithHelp
          name="assetsDirectory"
          value={conf?.assetsDirectory}
          onChange={onChange}
          label="Assets directory"
          help="The git directory where you would like static asset files (like images) to be stored."
          placeholder="_contents/assets"
          required={true}
        />
        <InputWithHelp
          name="collectionsDirectory"
          value={conf?.collectionsDirectory}
          onChange={onChange}
          label="Collections directory"
          help={
            <span>
              The git directory where you would like collection items (
              <code>.md</code> files) to be stored.
            </span>
          }
          placeholder="_contents/collections"
          required={true}
        />
        <div className="uc-part is-clearfix">
          <button
            onClick={save}
            disabled={!hasChanges()}
            className="button is-primary is-light is-pulled-right"
          >
            Save changes
          </button>
        </div>
      </fieldset>
    </section>
  );
}

function InputWithHelp({
  name,
  value,
  onChange,
  label = "",
  help = "",
  placeholder = "",
  required = false,
}) {
  return (
    <div className="uc-part field">
      <label className="label uc-d-inline-block uc-d-block-sm mr-6 mb-1">
        {label}
        {required && <span className="has-text-danger-dark ml-1">*</span>}
      </label>
      <p className="help uc-d-inline-block uc-d-block-sm mt-0 mb-1 uc-float-right uc-float-left-sm">
        {help}
      </p>
      <div className="control">
        <TextInput
          name={name}
          value={value}
          onChange={onChange}
          className="input"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
